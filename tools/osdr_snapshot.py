#!/usr/bin/env python3
"""Build js/osdr.js — real NASA spaceflight biology studies for each NovaCare body system.

Source: NASA Open Science Data Repository (OSDR) Biological Data API
        https://visualization.osdr.nasa.gov/biodata/api/

The API does not send CORS headers, so a browser page cannot call it directly.
This script takes a snapshot instead; the app ships it as a static file, which
also means the studies are available offline, with no link to Earth.

Usage (from the project folder):  python3 tools/osdr_snapshot.py
"""
import json
import re
import subprocess
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timezone
from pathlib import Path

API = 'https://visualization.osdr.nasa.gov/biodata/api/v2'
OUT = Path(__file__).resolve().parent.parent / 'js' / 'osdr.js'
PER_SYSTEM = 6

# NovaCare body system id -> words that place a study in that system.
# Matched against tissue, title, factors and project title (lower-case).
SYSTEMS = {
    'musculo':   r'skeletal muscle|muscle|soleus|gastrocnemius|quadriceps|tibialis|extensor digitorum|\bbone\b|bones|femur|tibia|osteo|skelet|tendon|spine|vertebra|cartilage',
    'heart':     r'heart|cardi|aorta|vascular|artery|arteri|endotheli|blood vessel|myocard',
    'eyes':      r'\beye\b|eyes|retina|optic|ocular|vision|\blens\b',
    'immune':    r'immun|spleen|thymus|lymph|t[- ]cell|leukocyte|bone marrow|radiation|irradiat|ionizing|heavy ion|\bhze\b|gamma ray|proton|galactic cosmic',
    'brain':     r'brain|neur|hippocamp|cortex|cerebell|behavio|cognit|sleep|circadian|isolation|organoid.*neur|alzheimer',
    'lungs':     r'lung|pulmonar|airway|respirat|trachea|alveol|carbon dioxide|hypercapn',
    'metabolic': r'liver|hepat|kidney|renal|adipose|\bfat\b|intestin|\bgut\b|colon|microbio|metabol|nutrition|\bdiet\b|pancrea|insulin',
}
# Indicator id -> words in a study's title, factors or description that make it evidence for that measurement.
INDICATORS = {
    'sys': r'blood pressure|hypertens|cardiovascular|vascular|arter',
    'dia': r'blood pressure|hypertens|cardiovascular|vascular|arter',
    'hr': r'heart rate|cardiac|cardiomyocyte|\bheart\b',
    'spo2': r'hypoxi|oxygen saturation|hyperoxi|\blung',
    'temp': r'fever|immune|inflammat|infection|cytokine',
    'glu': r'glucose|insulin|diabet|metabolic panel|metabolom',
    'sleep': r'\bsleep|circadian',
    'mood': r'behavio|depress|\bmood|anxiety|cognit',
    'stress': r'cortisol|psycholog|behavio|isolation|confinement',
    'water': r'kidney|renal|fluid shift|hydrat|dehydrat',
    'exercise': r'exercise|countermeasure|treadmill|resistive|physical activity',
    'mass': r'body mass|body weight|weight loss|muscle atrophy|atroph|unloading',
    'vision': r'\beye|retina|optic|ocular|vision',
    'rad': r'radiation|irradiat|ionizing|heavy ion|cosmic',
    'co2': r'carbon dioxide|\bco2\b|hypercapn',
}
PER_INDICATOR = 3
ORG_RANK = {'Homo sapiens': 0, 'Mus musculus': 1, 'Rattus norvegicus': 1}
ORG_NAME = {'Homo sapiens': 'Human', 'Mus musculus': 'Mouse', 'Rattus norvegicus': 'Rat',
            'Drosophila melanogaster': 'Fruit fly', 'Caenorhabditis elegans': 'Worm (C. elegans)',
            'Arabidopsis thaliana': 'Plant (Arabidopsis)', 'Danio rerio': 'Zebrafish'}


def fetch(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'NovaCare-prototype/1.0'})
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.URLError as e:
        if 'CERTIFICATE_VERIFY_FAILED' not in str(e):
            raise
        # python.org builds on macOS ship without root certificates: fall back to curl.
        out = subprocess.run(['curl', '-sSf', '--max-time', '60', url], capture_output=True, check=True)
        return json.loads(out.stdout)


def get(url, tries=4):
    for i in range(tries):
        try:
            return fetch(url)
        except Exception:
            if i == tries - 1:
                raise
            time.sleep(2 * (i + 1))


def text(v):
    if isinstance(v, list):
        return ' '.join(text(x) for x in v)
    if isinstance(v, dict):
        return ' '.join(text(x) for x in v.values())
    return str(v or '')


def first(v):
    if isinstance(v, list):
        v = next((x for x in v if x), '')
    return str(v or '').strip()


def summary(desc, limit=230):
    desc = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', desc or '')).strip()
    if len(desc) <= limit:
        return desc
    cut = desc[:limit]
    end = max(cut.rfind('. '), cut.rfind('; '))
    return (cut[:end + 1] if end > 80 else cut.rsplit(' ', 1)[0] + '…').strip()


def study(acc):
    try:
        m = get(f'{API}/dataset/{acc}/')[acc]['metadata']
    except Exception as e:
        print(f'  skip {acc}: {e}', file=sys.stderr)
        return None
    organism = first(m.get('organism'))
    mission = (m.get('mission') or {}).get('name') or ''
    ptype = first(m.get('project type'))
    released = m.get('study public release date')
    year = datetime.fromtimestamp(released, timezone.utc).year if isinstance(released, (int, float)) else None
    # The tissue and title decide the body system; the description is too broad to use.
    haystack = ' '.join([text(m.get('material type')), text(m.get('study title'))]).lower()
    systems = [sid for sid, rx in SYSTEMS.items() if re.search(rx, haystack)]
    tissue = first(m.get('material type')).lower()
    in_vitro = bool(re.search(r'cell|cultur|organoid|myoblast|chip|media', tissue))
    wide = (haystack + ' ' + text(m.get('study factor name')) + ' ' + text(m.get('study description'))[:1500]).lower()
    indicators = [iid for iid, rx in INDICATORS.items() if re.search(rx, wide)]
    in_title = [iid for iid, rx in INDICATORS.items() if re.search(rx, (text(m.get('study title')) + ' ' + text(m.get('study factor name'))).lower())]
    spaceflight = bool(mission) or 'spaceflight' in ptype.lower() or 'flight' in text(m.get('study factor name')).lower()
    return {
        'id': acc,
        'title': first(m.get('study title')),
        'organism': ORG_NAME.get(organism, organism or 'Unknown organism'),
        'tissue': first(m.get('material type')),
        'mission': mission or first(m.get('project identifier')),
        'kind': 'Spaceflight' if spaceflight else (ptype or 'Ground study'),
        'year': year,
        'about': summary(text(m.get('study description'))),
        'url': f'https://osdr.nasa.gov/bio/repo/data/studies/{acc}',
        '_systems': systems,
        '_indicators': indicators, '_in_title': in_title,
        # Astronaut samples first, then animals flown in space, then cell studies; newest first.
        '_rank': (ORG_RANK.get(organism, 2) * 2 + (2 if in_vitro else 0), 0 if spaceflight else 1, -(year or 0)),
    }


def main():
    ids = list(get(f'{API}/datasets/').keys())
    print(f'{len(ids)} OSDR datasets — fetching metadata…')
    with ThreadPoolExecutor(max_workers=6) as pool:
        studies = [s for s in pool.map(study, ids) if s and s['title']]
    out = {}
    for sid in SYSTEMS:
        hits = sorted((s for s in studies if sid in s['_systems']), key=lambda s: s['_rank'])
        picked, seen = [], set()
        for s in hits:  # one entry per study series (OSDR splits some studies by tissue)
            key = re.sub(r'\W+', ' ', s['title'].lower())[:45]
            if key not in seen:
                seen.add(key); picked.append(s)
        out[sid] = {
            'total': len(hits),
            'humans': sum(1 for s in hits if s['organism'] == 'Human'),
            'studies': [{k: v for k, v in s.items() if not k.startswith('_')} for s in picked[:PER_SYSTEM]],
        }
        print(f'  {sid:10s} {len(hits):4d} studies ({out[sid]["humans"]} human)')
    by_ind = {}
    for iid in INDICATORS:
        # studies that name the measurement in their title or factors come first
        hits = sorted((s for s in studies if iid in s['_indicators'] and s['organism'] in ('Human', 'Mouse', 'Rat')), key=lambda s: (iid not in s['_in_title'], s['_rank']))
        picked, seen = [], set()
        for s in hits:
            key = re.sub(r'\W+', ' ', s['title'].lower())[:45]
            if key not in seen:
                seen.add(key); picked.append({k: v for k, v in s.items() if not k.startswith('_') and k != 'about'})
            if len(picked) == PER_INDICATOR: break
        by_ind[iid] = {'total': len(hits), 'studies': picked}
        print(f'  {iid:9s} {len(hits):4d} studies')
    payload = {'source': 'NASA Open Science Data Repository (OSDR) — Biological Data API',
               'api': 'https://visualization.osdr.nasa.gov/biodata/api/',
               'snapshot': date.today().isoformat(), 'datasets': len(studies), 'systems': out, 'indicators': by_ind}
    OUT.write_text('/* Generated by tools/osdr_snapshot.py — do not edit by hand.\n'
                   '   Real NASA spaceflight biology studies for each body system (offline snapshot). */\n'
                   'const OSDR = ' + json.dumps(payload, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
    print(f'wrote {OUT}')


if __name__ == '__main__':
    main()
