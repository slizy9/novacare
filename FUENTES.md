# Fuentes de NovaCare

Lista de todas las fuentes de información que usa la página, en formato APA 7. Fecha de consulta de las páginas web: 14 de noviembre de 2026 (día en que se descargaron los datos de NASA OSDR).

Las secciones 1 a 4 son fuentes que la página usa o enlaza directamente. La sección 5 es la herramienta de inteligencia artificial con la que se programó. La sección 6 lista lo que **todavía no tiene una fuente** y hay que completar antes de entregar.

---

## 1. Riesgos de salud y estándares de la NASA

Se usan en Signos vitales, Peligros, la base de conocimiento (Preguntas) y la explicación "Por qué" de cada recomendación.

### Estándar de salud de la tripulación

- National Aeronautics and Space Administration. (s.f.). *NASA Space Flight Human-System Standard, Volume 1: Crew Health* (NASA-STD-3001, Vol. 1). Office of the Chief Health and Medical Officer. https://www.nasa.gov/ochmo/hsa-standards/
  - De aquí sale el límite de radiación de toda la carrera: 600 mSv.
- National Aeronautics and Space Administration. (s.f.). *NASA Space Flight Human-System Standard, Volume 2: Human Factors, Habitability, and Environmental Health* (NASA-STD-3001, Vol. 2). Office of the Chief Health and Medical Officer. https://www.nasa.gov/ochmo/hsa-standards/
  - De aquí salen los límites de la atmósfera de la nave y del CO₂.

> El código enlaza la página de los estándares sin indicar la revisión. Si se quiere citar una versión concreta, hay que tomar la revisión y el año de esa página y cambiar el "s.f.".

### Riesgos del Programa de Investigación Humana (HRP)

Todos están en el Human Research Roadmap: https://humanresearchroadmap.nasa.gov/risks/

Formato APA para cada uno:

> National Aeronautics and Space Administration, Human Research Program. (s.f.). *[nombre del riesgo]*. Human Research Roadmap. Recuperado el 14 de noviembre de 2026, de https://humanresearchroadmap.nasa.gov/risks/

Riesgos usados:

1. Risk of Cardiovascular Adaptations Contributing to Adverse Mission Performance and Health Outcomes
2. Risk of Adverse Cognitive or Behavioral Changes and Psychiatric Disorders
3. Risk of Inadequate Cooperation, Coordination, Communication and Psychosocial Adaptation within a Team
4. Risk of Performance Decrements and Adverse Health Outcomes Resulting from Sleep Loss, Circadian Desynchronization, and Work Overload
5. Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)
6. Risk of Altered Sensorimotor/Vestibular Function
7. Risk of In Mission Impacts, Adverse Health Events or Long-Term Health Impacts due to Altered Immune Response
8. Risk due to Host-Microorganism Interactions
9. Risk of Renal Stone Formation
10. Risk of Bone Fracture due to Spaceflight-induced Changes to Bone
11. Risk of Mission Performance Decrements and Adverse Health Outcomes Resulting from Reduced Cardiorespiratory and Musculoskeletal Fitness
12. Risk of Performance Decrement and Crew Illness Due to Inadequate Food and Nutrition
13. Risk of Reduced Crew Health and Performance Due to Hypoxia
14. Risk of Radiation Carcinogenesis
15. Risk due to Celestial Dust Exposure
16. Risk of Decompression Sickness
17. Risk of Adverse Health Outcomes and Decrements in Performance Due to Medical Conditions that occur in Mission
18. Risk of Ineffective or Toxic Medications During Long-Duration Exploration Spaceflight
19. Risk of Adverse Mission Outcomes Due to Earth Independent Human-Systems Operations

> Los nombres son los que usa el código. Algunos (3, 6, 8, 15 y 19) están algo acortados, así que conviene copiar el nombre exacto de la página del Roadmap antes de entregar.

---

## 2. Datos científicos: NASA Open Science Data Repository (OSDR)

Se usan en el escáner del cuerpo (Resumen), en la sección "Investigación NASA" y en la evidencia de cada indicador. Los datos se descargaron el 14 de noviembre de 2026 con `tools/osdr_snapshot.py`. La API revisó 646 conjuntos de datos y la página muestra 57 estudios.

### El repositorio y la API

- National Aeronautics and Space Administration. (s.f.). *NASA Open Science Data Repository (OSDR)*. Recuperado el 14 de noviembre de 2026, de https://osdr.nasa.gov/bio/repo/
- National Aeronautics and Space Administration. (s.f.). *OSDR Biological Data API* (v2) [Interfaz de programación]. Recuperado el 14 de noviembre de 2026, de https://visualization.osdr.nasa.gov/biodata/api/

### Los 57 estudios que muestra la página

El año es el que da OSDR para cada estudio. Si el profesor pide autores, están en la página de cada estudio, junto con su DOI.

- NASA Open Science Data Repository. (2012). *Gene responses in mouse brain to long-term exposure to microgravity* (OSD-33) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-33
- NASA Open Science Data Repository. (2010). *Woman skeletal muscle transcriptome with bed rest and countermeasures* (OSD-51) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-51
- NASA Open Science Data Repository. (2014). *Gene expression profiling of human peripheral blood lymphocytes cultured in modeled microgravity* (OSD-56) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-56
- NASA Open Science Data Repository. (2016). *Immediate Transcriptional Changes in Response to High Dose Radiation Exposure* (OSD-71) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-71
- NASA Open Science Data Repository. (2014). *Gene expression profiles of irradiated lung tissue in three mouse strains* (OSD-93) [Conjunto de datos; estudio en tierra, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-93
- NASA Open Science Data Repository. (2016). *Global gene expression profiles of cardiac progenitors differentiated from human pluripotent stem cells in 3D culture under simulated microgravity* (OSD-127) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-127
- NASA Open Science Data Repository. (2014). *Proton irradiation augments the reduction in tumor progression observed with advanced age* (OSD-131) [Conjunto de datos; estudio en tierra, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-131
- NASA Open Science Data Repository. (2014). *Radiation-induced bystander effects and gene expression in cells deficient for RAD9* (OSD-183) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-183
- NASA Open Science Data Repository. (2018). *Effects of 21 days of bedrest on human skeletal muscle gene expression* (OSD-195) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-195
- NASA Open Science Data Repository. (2016). *Effects of bedrest and hypoxia on human skeletal muscle miRNA expression* (OSD-198) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-198
- NASA Open Science Data Repository. (2019). *Transcriptomic analysis of liver from mice subjected to simulated spaceflight euthanasia, freezing, and tissue preservation protocols* (OSD-235) [Conjunto de datos; estudio en tierra, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-235
- NASA Open Science Data Repository. (2019). *Transcriptional analysis of lung from mice flown on the RR-6 mission* (OSD-248) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-248
- NASA Open Science Data Repository. (2019). *Transcriptional analysis of kidneys from mice flown on the RR-7 mission* (OSD-253) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-253
- NASA Open Science Data Repository. (2019). *Transcriptional analysis of dorsal skin from mice flown on the RR-7 mission* (OSD-254) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-254
- NASA Open Science Data Repository. (2017). *Galactic cosmic radiation induces stable epigenome alterations relevant to human lung cancer* (OSD-317) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-317
- NASA Open Science Data Repository. (2020). *Comprehensive multi-omics analysis reveals mitochondrial stress as a central biological hub for spaceflight impact* (OSD-343) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-343
- NASA Open Science Data Repository. (2018). *Real-time quantitative PCR analysis of human cardiovascular progenitor cells flown aboard the International Space Station* (OSD-344) [Conjunto de datos; vuelo espacial, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-344
- NASA Open Science Data Repository. (2020). *Molecular Transducers of Human Skeletal Muscle Remodeling under Different Loading States* (OSD-354) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-354
- NASA Open Science Data Repository. (2021). *Inflammatory gene expression signatures in idiopathic intracranial hypertension: possible implications in microgravity-induced ICP elevation - CSF* (OSD-363) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-363
- NASA Open Science Data Repository. (2010). *Insulin resistance induced by physical inactivity is associated with multiple transcriptional changes in skeletal muscle in young men* (OSD-370) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-370
- NASA Open Science Data Repository. (2017). *Dataset for dose and time-dependent transcriptional response to ionizing radiation exposure* (OSD-410) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-410
- NASA Open Science Data Repository. (2024). *The impact of deep space radiation on cognitive performance: From biological sex to biomarkers to countermeasures (Elevated Plus Maze, Novel Object Recognition, Open Field, Radial Arm Water Maze, and Three Chamber Social Isolation/Interaction)* (OSD-479) [Conjunto de datos; estudio en tierra, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-479
- NASA Open Science Data Repository. (2024). *Modeling cellular responses to serum and vitamin D in microgravity using a human kidney microphysiological system* (OSD-516) [Conjunto de datos; vuelo espacial, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-516
- NASA Open Science Data Repository. (2022). *Transcriptomic response of bioengineered human cartilage to parabolic flight microgravity is sex-dependent* (OSD-539) [Conjunto de datos; estudio a gran altitud, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-539
- NASA Open Science Data Repository. (2022). *Ten-day human unilateral lower limb suspension and active recovery in young healthy men* (OSD-540) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-540
- NASA Open Science Data Repository. (2022). *Effects of 14 days of confinement on blood gene expression profiles in men* (OSD-542) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-542
- NASA Open Science Data Repository. (2023). *Spaceflight influences gene expression, photoreceptor integrity, and oxidative stress related damage in the murine retina (RR-9)* (OSD-557) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-557
- NASA Open Science Data Repository. (2023). *Characterization of mouse ocular responses (Microscopy) to a 35-day (RR-9) spaceflight mission: Evidence of blood-retinal barrier disruption and ocular adaptations* (OSD-568) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-568
- NASA Open Science Data Repository. (2024). *SpaceX Inspiration4 Plasma Profiling: Proteomics, EVPs, Metabolomics, cfDNA Sequencing and cfRNA Sequencing* (OSD-571) [Conjunto de datos; vuelo espacial, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-571
- NASA Open Science Data Repository. (2024). *SpaceX Inspiration4 Blood Serum Metabolic Panel and Immune/Cardiac Cytokine Arrays (Comprehensive Metabolic Panel and Multiplex)* (OSD-575) [Conjunto de datos; vuelo espacial, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-575
- NASA Open Science Data Repository. (2024). *Transcriptomic Effects on the Mouse Heart Following 30 Days on the International Space Station* (OSD-599) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-599
- NASA Open Science Data Repository. (2024). *Spaceflight effects on human vascular smooth muscle cell phenotype and function* (OSD-635) [Conjunto de datos; vuelo espacial, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-635
- NASA Open Science Data Repository. (2024). *SpaceX Inspiration4 Urine Inflammation Panel (Multiplex, NULISAseq)* (OSD-656) [Conjunto de datos; vuelo espacial, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-656
- NASA Open Science Data Repository. (2024). *Head-Down Tilt As a Model for Intracranial and Intraocular Pressures, and Retinal Changes during Spaceflight (Eye, MRI, Optical Coherence Tomography, Tonometry, A-scan)* (OSD-679) [Conjunto de datos; estudio en tierra, ratas]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-679
- NASA Open Science Data Repository. (2024). *Characterization of mouse ocular response to a 35-day spaceflight mission: Evidence of blood-retinal barrier disruption and ocular adaptations - Proteomics data* (OSD-715) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-715
- NASA Open Science Data Repository. (2024). *Artificial Gravity Attenuates the Transcriptomic Response to Spaceflight in the Optic Nerve and Retina -- Retina data* (OSD-758) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-758
- NASA Open Science Data Repository. (2024). *Transcriptional profiling of kidney tissue from mice flown on the Rodent Research Reference Mission-2 (RRRM-2)* (OSD-771) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-771
- NASA Open Science Data Repository. (2024). *Multidirectional effect of low-intensity electrical myostimulation on gene expression and phenotype in thigh and calf muscles after one week of disuse - soleus data* (OSD-783) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-783
- NASA Open Science Data Repository. (2024). *Skeletal muscle-on-a-chip in microgravity as a platform for regeneration modeling and drug screening - vastus lateralis data* (OSD-787) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-787
- NASA Open Science Data Repository. (2025). *Space microgravity increases expression of genes associated with proliferation and differentiation in human cardiac spheres* (OSD-811) [Conjunto de datos; vuelo espacial, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-811
- NASA Open Science Data Repository. (2026). *The ex vivo human translaminar autonomous system to study spaceflight associated neuro-ocular syndrome pathogenesis (Ocular Globe, Photography)* (OSD-815) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-815
- NASA Open Science Data Repository. (2025). *Effects of 5-Ion Beam Irradiation and Hindlimb Unloading on Metabolic Pathways in Plasma and Brain of Behaviorally Tested WAG/Rij Rats - Plasma data* (OSD-832) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-832
- NASA Open Science Data Repository. (2025). *Transcriptional profiling of lungs from mice flown on the RR-10 mission* (OSD-900) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-900
- NASA Open Science Data Repository. (2026). *MicroRNAs shape mouse age-independent tissue adaptation to spaceflight via ECM and developmental pathways - Subcutaneous Adipose Tissue (SCAT) data* (OSD-904) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-904
- NASA Open Science Data Repository. (2026). *MicroRNAs shape mouse age-independent tissue adaptation to spaceflight via ECM and developmental pathways - Heart data* (OSD-908) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-908
- NASA Open Science Data Repository. (2026). *MicroRNAs shape mouse age-independent tissue adaptation to spaceflight via ECM and developmental pathways - Kidney data* (OSD-913) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-913
- NASA Open Science Data Repository. (2026). *MicroRNAs shape mouse age-independent tissue adaptation to spaceflight via ECM and developmental pathways - Lung data* (OSD-915) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-915
- NASA Open Science Data Repository. (2026). *MicroRNAs shape mouse age-independent tissue adaptation to spaceflight via ECM and developmental pathways - Brain data* (OSD-916) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-916
- NASA Open Science Data Repository. (2026). *Spaceflight induces systemic effects on extracellular matrix and immune system in different age-stages - Eye data* (OSD-920) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-920
- NASA Open Science Data Repository. (2026). *Spaceflight induces systemic effects on extracellular matrix and immune system in different age-stages - Heart atria data* (OSD-921) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-921
- NASA Open Science Data Repository. (2026). *Spaceflight induces systemic effects on extracellular matrix and immune system in different age-stages - Large intestine data* (OSD-923) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-923
- NASA Open Science Data Repository. (2026). *Spaceflight induces systemic effects on extracellular matrix and immune system in different age-stages - Myeloid cerebellum data* (OSD-927) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-927
- NASA Open Science Data Repository. (2026). *Spaceflight reshapes Alzheimer's disease–associated molecular programs in human brain organoids* (OSD-941) [Conjunto de datos; vuelo espacial, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-941
- NASA Open Science Data Repository. (2024). *Exercise Training Attenuates the Muscle Mitochondria Genomic Response to Bed Rest (microarray data)* (OSD-942) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-942
- NASA Open Science Data Repository. (2026). *Automated behavioral segmentation and markerless pose tracking of mice during spaceflight* (OSD-952) [Conjunto de datos; vuelo espacial, ratones]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-952
- NASA Open Science Data Repository. (2017). *Impact of Neutron Exposure on Global Gene Expression in a Human Peripheral Blood Model* (OSD-1012) [Conjunto de datos; estudio en tierra, humanos]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-1012
- NASA Open Science Data Repository. (2026). *Differential Impact of Social Isolation and Space Radiation on Behavior and Motor Learning in Rats* (OSD-1018) [Conjunto de datos; estudio en tierra, ratas]. https://osdr.nasa.gov/bio/repo/data/studies/OSD-1018

---

## 3. Escalas psicológicas (sección Mente)

El chequeo semanal de Mente usa estas escalas. Son de uso libre.

- Kroenke, K., Spitzer, R. L., & Williams, J. B. W. (2001). The PHQ-9: Validity of a brief depression severity measure. *Journal of General Internal Medicine, 16*(9), 606–613. https://doi.org/10.1046/j.1525-1497.2001.016009606.x
- Kroenke, K., Spitzer, R. L., & Williams, J. B. W. (2003). The Patient Health Questionnaire-2: Validity of a two-item depression screener. *Medical Care, 41*(11), 1284–1292. https://doi.org/10.1097/01.MLR.0000093487.78664.3C
- Spitzer, R. L., Kroenke, K., Williams, J. B. W., & Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: The GAD-7. *Archives of Internal Medicine, 166*(10), 1092–1097. https://doi.org/10.1001/archinte.166.10.1092
- Kroenke, K., Spitzer, R. L., Williams, J. B. W., Monahan, P. O., & Löwe, B. (2007). Anxiety disorders in primary care: Prevalence, impairment, comorbidity, and detection. *Annals of Internal Medicine, 146*(5), 317–325. https://doi.org/10.7326/0003-4819-146-5-200703060-00004
  - Este artículo presenta el GAD-2.

---

## 4. Software, tipografías y métodos

- Andersson, R., & The Inter Project Authors. (2016). *Inter* [Tipografía; SIL Open Font License 1.1]. https://github.com/rsms/inter
- Undercase Type & The Fraunces Project Authors. (2020). *Fraunces* [Tipografía; SIL Open Font License 1.1]. https://github.com/undercasetype/Fraunces
- Supabase. (s.f.). *supabase-js* [Biblioteca de software; licencia MIT]. https://github.com/supabase/supabase-js
  - Guarda las cuentas y las misiones en la nube.
- Ollama. (s.f.). *Ollama* (Versión 0.5.7) [Software]. https://github.com/ollama/ollama
  - Ejecuta el modelo de lenguaje local en la terminal de la nave.
- Qwen Team. (2024). *Qwen2.5 technical report* (arXiv:2412.15115). arXiv. https://arxiv.org/abs/2412.15115
  - El modelo `qwen2.5:1.5b` solo redacta las respuestas. No toma decisiones.
- Robertson, S., & Zaragoza, H. (2009). The probabilistic relevance framework: BM25 and beyond. *Foundations and Trends in Information Retrieval, 3*(4), 333–389. https://doi.org/10.1561/1500000019
  - Es el método de búsqueda de la sección Preguntas.

### Imágenes

- **Foto de Bruno** (`img/crew/bruno-llobet-chanto.jpg`): foto propia del equipo.
- **La Tierra** de la portada y del inicio: la dibuja el código (`js/earth.js`). No es una imagen descargada.
- **Logo** (`img/logo.svg`): diseño propio.
- **`img/station.jpg`**, el fondo de la pantalla de misión: **no tiene fuente registrada.** Llegó con el commit `442a952` y no tiene autor ni crédito en sus datos. Hay que buscar de dónde salió y citarla. Si es de la NASA, el formato es: National Aeronautics and Space Administration. (año). *Título de la imagen* [Fotografía]. URL

---

## 5. Herramienta de inteligencia artificial

El código, los textos de la página, la presentación y estos documentos se hicieron con Claude, el modelo de Anthropic, usado a través de Claude Code. El equipo dio las ideas, las instrucciones y las revisiones. La lista de esas instrucciones está en [PROMPTS.md](PROMPTS.md).

### Referencias en APA 7

- Anthropic. (2026). *Claude* (versión Opus 5.5) [Modelo de lenguaje de gran tamaño]. https://claude.ai
- Anthropic. (2026). *Claude Code* [Software de programación asistida por inteligencia artificial]. https://claude.com/claude-code

### Cita dentro del texto

- Entre paréntesis: (Anthropic, 2026)
- En la narración: Anthropic (2026)

### Ejemplo de cómo describir el uso

APA recomienda explicar cómo se usó la herramienta, por ejemplo en la sección de metodología:

> Para programar NovaCare se usó Claude (versión Opus 5.5; Anthropic, 2026) a través de Claude Code, entre el 14 y el 15 de noviembre de 2026. El equipo definió la idea, escribió las instrucciones y revisó cada versión. Claude escribió el código, conectó los datos de la NASA y probó la página. Las instrucciones principales están en el anexo PROMPTS.md.

> Detalle: el modelo principal fue Claude Opus 5.5. En algunas tareas cortas también se usó Claude Fable 5.2. Si el profesor pide mencionarlo, la referencia es la misma con "(versión Fable 5.2)".

---

## 6. Contenido que todavía no tiene fuente

Esta información está en la página, pero el código no dice de dónde salió. Es conocimiento general. Para una entrega formal conviene buscar una fuente para cada punto o decir que es una simplificación.

1. **Rangos de referencia de los signos vitales** (presión arterial, frecuencia cardíaca, SpO₂, temperatura, glucosa). El código los llama "valores clínicos generales simplificados para adultos". Fuentes posibles: la American Heart Association para la presión y la American Diabetes Association para la glucosa.
2. **Dosis de medicamentos** (paracetamol 15 mg/kg, ibuprofeno 400 mg, amoxicilina 500 mg, ondansetrón 4 mg, epinefrina 0,3 mg y otros) y las **interacciones** entre ellos. El código dice que son "dosis de referencia estándar para adultos (valores de prototipo)". Hay que citar una referencia de fármacos o la ficha técnica de cada medicamento.
3. **Pasos de primeros auxilios y protocolos** de la base de conocimiento (dolor de cabeza, quemaduras, cortes, incendio, despresurización y otros). El README dice que son "guía general de primeros auxilios adaptada al vuelo espacial". Están vinculados a los riesgos HRP de la sección 1, pero los pasos concretos no tienen fuente.
4. **Programas guiados de Mente**: terapia cognitivo-conductual para el insomnio y para la ansiedad, activación conductual y comunicación en la tripulación. También la respiración lenta 4-2-6 y la respiración en caja. Se basan en técnicas conocidas de psicología, sin una referencia concreta.
5. **Inventario de la misión**: cantidades de comida, agua y material médico. El README dice que son "estimaciones de prototipo a partir de cifras públicas de misiones largas en estación". No se anotó qué cifras.
6. **Datos sueltos** que aparecen en los textos:
   - Unas 16 salidas de sol al día en órbita.
   - Hasta 20 minutos de retraso en cada sentido para comunicarse con Marte.
   - La pérdida de hueso de 1 a 1,5 % por mes en microgravedad, que usa el modelo de predicción (`js/predict.js`). Encaja con el riesgo HRP de fractura ósea de la sección 1, pero conviene citar la cifra directamente.
