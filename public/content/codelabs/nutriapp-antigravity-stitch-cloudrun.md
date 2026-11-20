summary: Diseña NutriApp con Google Stitch, conecta el servidor MCP de Stitch en Antigravity IDE para generar cálculos antropométricos, macros y micronutrientes, y despliega la solución en Google Cloud Run en menos de 50 minutos.
id: nutriapp-antigravity-stitch-cloudrun
categories: Cloud, AI, Web, HealthTech
tags: antigravity, stitch, mcp, cloud-run, gcp, nutriapp
status: Published
authors: Maureen Barahona
Feedback Link: https://github.com/

# Orquestando la salud con Antigravity

*Por Maureen Barahona*

## 1. Introducción y requisitos
Duration: 0:04:00

En este codelab aprenderás el flujo **Design-to-Code** siguiendo la guía oficial de **Google Stitch** y **Antigravity IDE** conectada mediante **Model Context Protocol (MCP)**, extendido hasta el despliegue en producción en **Google Cloud Run**.

Construirás **NutriApp**, una aplicación web de evaluación nutricional clínica y preventiva que, a partir de los datos de un paciente (edad, sexo, peso, talla, circunferencia de cintura y nivel de actividad física), calcula automáticamente sus **indicadores antropométricos** y sugiere sus requerimientos diarios de **macronutrientes** y **micronutrientes esenciales** para mantenerse sano.

### Qué construirás

* **Módulo Antropométrico de NutriApp:** Cálculo en tiempo real de Índice de Masa Corporal (IMC) según rangos OMS, Índice Cintura-Estatura (ICA) para riesgo cardiometabólico, Tasa Metabólica Basal (ecuación de Mifflin-St Jeor) y Gasto Energético Total (GET).
* **Sugerencia de Macronutrientes:** Distribución personalizada en gramos/día de proteínas, carbohidratos complejos, grasas saludables y fibra dietética.
* **Panel de Micronutrientes Esenciales:** Recomendación diaria de vitaminas y minerales críticos (Vitamina D, Vitamina C, Hierro, Calcio, Magnesio, Zinc, Potasio y Folato) ajustada por sexo y grupo etario, con fuentes alimentarias sugeridas.
* **Despliegue Serverless en Google Cloud Run:** Contenerización con Docker y Nginx lista para producción con URL HTTPS pública.

### Arquitectura y flujo de trabajo

```text
+-----------------+     Stitch MCP     +-------------------+     Docker + gcloud     +-------------------+
|  Google Stitch  | -----------------> |  Antigravity IDE  | ----------------------> | Google Cloud Run  |
| (UI NutriApp)   |  (API Key + Specs) | (Agente + Código) |   (Cloud Build / CLI)   | (HTTPS en vivo)   |
+-----------------+                    +-------------------+                         +-------------------+
```

### Tiempo estimado y requisitos previos

* **Duración total:** 44 minutos.
* **Cuenta de Google** con acceso a [Google Stitch](https://stitch.withgoogle.com).
* **Antigravity IDE** instalado en tu equipo local junto con su CLI (`agy`).
* **Node.js 22 LTS** (o superior) y **npm** instalados localmente.
* **Cuenta de Google Cloud Platform (GCP)** con facturación activa y **Google Cloud CLI (`gcloud`)** instalada.

Positive : **Tip de tiempo:** Para completar el taller en menos de 50 minutos, mantén abiertas en tu navegador las pestañas de Google Stitch y Google Cloud Console antes de iniciar la Sección 2.

---

## 2. Diseña la interfaz de NutriApp en Google Stitch
Duration: 0:08:00

Comenzarás generando la identidad visual y la estructura completa de **NutriApp** mediante lenguaje natural en Google Stitch.

### Paso 2.1: Crear el proyecto en Stitch

1. Abre [https://stitch.withgoogle.com](https://stitch.withgoogle.com) e inicia sesión con tu cuenta de Google.
2. Haz clic en **New Project** y selecciona formato **Web** (Desktop & Responsive).
3. Asigna el título `NutriApp - Evaluación Nutricional`.

### Paso 2.2: Generar la interfaz con el prompt maestro

En la barra de prompts de Stitch, pega exactamente la siguiente descripción y haz clic en **Generate**:

```text
Diseña una aplicación web clínica, moderna y accesible llamada "NutriApp" para evaluación antropométrica y requerimientos nutricionales diarios de un paciente.
Paleta de colores: fondo gris clínico suave (#F8FAFC), tarjetas blancas (#FFFFFF) con borde sutil (#E2E8F0), verde salvia médico como color primario (#0F766E), verde menta para indicadores óptimos (#10B981) y ámbar suave para alertas preventivas (#F59E0B). Tipografía sans-serif limpia y legible.

Distribución en una sola vista tipo dashboard responsivo:
1. Encabezado superior con logotipo de NutriApp, subtítulo "Evaluación Antropométrica y Nutrición Preventiva" y botón de "Reiniciar datos del paciente".
2. Panel izquierdo "Datos del Paciente": formulario limpio con controles para Edad (años), Sexo biológico (Femenino / Masculino), Peso (kg), Estatura (cm), Circunferencia de cintura (cm), Nivel de actividad física (Sedentario, Ligero, Moderado, Activo, Muy activo) y Objetivo de salud (Mantenimiento saludable, Control metabólico, Vitalidad y masa muscular).
3. Panel derecho superior "Indicadores Antropométricos": 4 tarjetas KPI con IMC (kg/m² y etiqueta de clasificación OMS), Índice Cintura-Estatura (con indicador de riesgo cardiometabólico), Tasa Metabólica Basal (kcal/día) y Gasto Energético Total recomendado (kcal/día).
4. Panel derecho medio "Macronutrientes Sugeridos": barras de progreso visuales con gramos diarios y porcentaje calórico para Proteínas, Carbohidratos Complejos, Grasas Saludables y Fibra Dietética.
5. Panel derecho inferior "Micronutrientes Esenciales Recomendados": cuadrícula clara de tarjetas pequeñas para Vitamina D, Vitamina C, Hierro, Calcio, Magnesio, Zinc, Potasio y Folato, mostrando la cantidad diaria sugerida (mg o mcg) y un alimento fuente clave.
6. Aviso discreto al pie indicando que los cálculos son orientativos y no sustituyen valoración médica o nutricional presencial.
```

Espera entre 20 y 40 segundos hasta que Stitch renderice el sistema de diseño y la pantalla principal.

### Paso 2.3: Refinar y obtener el Project ID y la API Key

1. Revisa la pantalla generada en el lienzo. Si deseas mejorar el contraste o legibilidad, haz clic en la pantalla y envía una iteración rápida:

```text
Asegura alto contraste en todas las etiquetas de unidades (kg, cm, kcal, g, mg, mcg) usando texto #334155 y badges claros para la clasificación del IMC.
```

2. Anota tu **Stitch Project ID** desde la URL del navegador: en `https://stitch.withgoogle.com/projects/TU_PROJECT_ID`, copia el identificador alfanumérico final.
3. Mantén abierta tu sesión de Google Stitch para generar tu **Stitch API Key** y configurar la conexión MCP guiada en la siguiente sección.

Negative : **Seguridad:** No pegues ni guardes tu `STITCH_API_KEY` dentro del código fuente del proyecto ni la subas a repositorios públicos. Solo la usará la configuración privada del servidor MCP en Antigravity.

---

## 3. Configura el servidor MCP de Stitch y Skills en Antigravity
Duration: 0:06:00

En esta sección conectarás **Google Stitch** directamente con **Antigravity IDE** usando el protocolo **MCP**, de modo que el agente lea los tokens visuales y estructura de NutriApp sin copiar y pegar estilos manualmente.

### Paso 3.1: Crear el directorio de trabajo y abrir Antigravity

En tu terminal local, crea la carpeta del proyecto y ábrela en Antigravity IDE:

```bash
mkdir -p ~/nutriapp
cd ~/nutriapp
```

### Paso 3.2: Configurar Stitch MCP Server en Antigravity

Sigue estos subpasos para generar tu llave en Google Stitch y registrarla en Antigravity IDE:

1. En **Google Stitch**, haz clic en tu **foto de perfil** (esquina superior derecha) y selecciona **Stitch Settings** **(1)**:

![Subpaso 1: Abrir Stitch Settings desde el menú de cuenta en Google Stitch](content/codelabs/img/nutriapp/paso-3-2-1.png)

2. Dentro de la sección **API key**, haz clic en el botón **Create key** para generar una nueva clave de acceso:

![Subpaso 2: Hacer clic en Create key dentro de la sección API key](content/codelabs/img/nutriapp/paso-3-2-2.png)

3. Verifica tu llave recién generada **(1)**, despliega la sección **Setup MCP**, selecciona **Antigravity** en *Client* junto con tu **API Key** **(2)** y copia tu clave desde el bloque **Configuration** **(3)**:

![Subpaso 3: Seleccionar cliente Antigravity en Setup MCP y copiar la API Key](content/codelabs/img/nutriapp/paso-3-2-3.png)

4. Al copiar la llave, abre **PowerShell** en tu equipo y ejecuta el siguiente código (reemplazando `TU_STITCH_API_KEY` por la llave copiada) para crear y guardar automáticamente `$env:USERPROFILE\.gemini\antigravity\mcp_config.json`:

```powershell
$configDir = "$env:USERPROFILE\.gemini\antigravity"
New-Item -ItemType Directory -Force -Path $configDir | Out-Null

@'
{
  "mcpServers": {
    "stitch": {
      "serverUrl": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key":  "TU_STITCH_API_KEY"
      }
    }
  }
}
'@ | Set-Content -Path "$configDir\mcp_config.json" -Encoding UTF8
```

### Paso 3.3: Instalar las habilidades de Stitch para el agente (Recomendado)

En la terminal integrada de Antigravity (`Ctrl+\``), instala las habilidades oficiales `stitch-skills` en el ámbito del proyecto para mejorar la traducción fiel de tokens y componentes:

```bash
npx skills add google-labs-code/stitch-skills --scope project
```

Deberías ver el mensaje confirmando que las skills de Stitch quedaron instaladas en el proyecto.

### Paso 3.4: Probar la conexión MCP

Abre el panel **Agent Chat** en Antigravity y escribe:

```text
List my Stitch projects
```

Deberías ver al agente consultar el servidor MCP de Stitch y listar el proyecto **NutriApp - Evaluación Nutricional** con su **Project ID**.

---

## 4. Extrae el contexto de diseño y genera NutriApp con Antigravity
Duration: 0:10:00

Ahora indicarás al agente autónomo de Antigravity que obtenga el diseño desde Stitch y genere el proyecto completo en React, TypeScript, Vite y Tailwind CSS con fórmulas clínicas reales.

### Paso 4.1: Solicitar la generación Design-to-Code al agente

En el **Agent Chat** de Antigravity, pega el siguiente prompt reemplazando `TU_STITCH_PROJECT_ID` por el ID obtenido en la Sección 2:

```text
Usa el servidor Stitch MCP para inspeccionar mi proyecto con ID "TU_STITCH_PROJECT_ID" (NutriApp - Evaluación Nutricional).
Analiza su sistema de diseño, paleta de colores, tipografía y distribución de tarjetas, y convierte el diseño en una aplicación web completa y lista para producción usando React, Vite, TypeScript y Tailwind CSS.

Especificaciones funcionales obligatorias para NutriApp:
1. Crea un módulo puro y tipado en `src/utils/nutriCalculations.ts` que calcule en tiempo real a partir de los datos del paciente (edad, sexo, pesoKg, tallaCm, cinturaCm, nivelActividad, objetivoSalud):
   - IMC = pesoKg / (tallaM ^ 2) y clasificación OMS ("Bajo peso", "Peso saludable", "Sobrepeso", "Obesidad").
   - Índice Cintura-Estatura (ICA = cinturaCm / tallaCm) e indicador de riesgo ("Óptimo <= 0.50", "Moderado 0.51-0.59", "Elevado >= 0.60").
   - Tasa Metabólica Basal (TMB) con Mifflin-St Jeor: (10 * pesoKg) + (6.25 * tallaCm) - (5 * edad) + (sexo === 'masculino' ? 5 : -161).
   - Gasto Energético Total (GET) multiplicando TMB por factor de actividad (1.2, 1.375, 1.55, 1.725, 1.9) y ajuste calórico según objetivo de salud.
   - Macronutrientes diarios sugeridos en gramos: Proteínas, Carbohidratos Complejos, Grasas Saludables y Fibra Dietética (14 g por cada 1000 kcal).
   - Micronutrientes esenciales diarios sugeridos (Vitamina D en mcg, Vitamina C en mg, Hierro en mg, Calcio en mg, Magnesio en mg, Zinc en mg, Potasio en mg y Folato en mcg) ajustados según sexo y edad (adultos 19-50 vs 51+), junto con alimentos fuente recomendados.
2. Conecta todos los controles del formulario en `src/App.tsx` para recalcular instantáneamente las tarjetas KPI, las barras de macronutrientes y la cuadrícula de micronutrientes.
3. Incluye validación de rangos saludables en los inputs (por ejemplo, peso entre 25 y 250 kg, talla entre 100 y 230 cm, edad entre 18 y 100 años) y un botón para restaurar valores de ejemplo.
4. Incluye al pie el aviso de que es una herramienta educativa de orientación y no reemplaza consulta médica o nutricional profesional.
```

Aprueba los pasos del plan cuando Antigravity solicite ejecutar la inicialización del proyecto e instalación de paquetes (`Approve`).

### Paso 4.2: Verificar la lógica clínica generada

Asegúrate de que `src/utils/nutriCalculations.ts` implemente las ecuaciones clínicas con precisión. Si deseas verificar o completar el módulo, confirma que contenga la siguiente estructura:

```typescript
export type BiologicalSex = 'femenino' | 'masculino';
export type ActivityLevel =
  | 'sedentario'
  | 'ligero'
  | 'moderado'
  | 'activo'
  | 'muy_activo';
export type HealthGoal = 'mantenimiento' | 'metabolico' | 'vitalidad';

export interface PatientInput {
  age: number;
  sex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  waistCm: number;
  activity: ActivityLevel;
  goal: HealthGoal;
}

export interface AnthropometricResult {
  bmi: number;
  bmiCategory: string;
  bmiStatus: 'optimo' | 'moderado' | 'alerta';
  whtr: number;
  whtrRisk: string;
  whtrStatus: 'optimo' | 'moderado' | 'alerta';
  bmr: number;
  tdee: number;
  targetCalories: number;
}

export interface MacroSuggestion {
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  fiberGrams: number;
  proteinPct: number;
  carbsPct: number;
  fatsPct: number;
}

export interface MicronutrientSuggestion {
  name: string;
  amount: string;
  role: string;
  foodSource: string;
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

export function calculateAnthropometrics(
  input: PatientInput
): AnthropometricResult {
  const heightM = Math.max(1, input.heightCm) / 100;
  const bmi = Number((input.weightKg / (heightM * heightM)).toFixed(1));

  let bmiCategory = 'Peso saludable';
  let bmiStatus: 'optimo' | 'moderado' | 'alerta' = 'optimo';
  if (bmi < 18.5) {
    bmiCategory = 'Bajo peso';
    bmiStatus = 'moderado';
  } else if (bmi >= 25 && bmi < 30) {
    bmiCategory = 'Sobrepeso';
    bmiStatus = 'moderado';
  } else if (bmi >= 30) {
    bmiCategory = 'Obesidad';
    bmiStatus = 'alerta';
  }

  const whtr = Number((input.waistCm / Math.max(100, input.heightCm)).toFixed(2));
  let whtrRisk = 'Riesgo cardiometabólico bajo';
  let whtrStatus: 'optimo' | 'moderado' | 'alerta' = 'optimo';
  if (whtr > 0.5 && whtr < 0.6) {
    whtrRisk = 'Riesgo cardiometabólico moderado';
    whtrStatus = 'moderado';
  } else if (whtr >= 0.6) {
    whtrRisk = 'Riesgo cardiometabólico elevado';
    whtrStatus = 'alerta';
  }

  const sexOffset = input.sex === 'masculino' ? 5 : -161;
  const bmr = Math.round(
    10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + sexOffset
  );

  const tdee = Math.round(bmr * ACTIVITY_FACTORS[input.activity]);

  let targetCalories = tdee;
  if (input.goal === 'metabolico') {
    targetCalories = Math.max(1200, Math.round(tdee * 0.85));
  } else if (input.goal === 'vitalidad') {
    targetCalories = Math.round(tdee * 1.1);
  }

  return {
    bmi,
    bmiCategory,
    bmiStatus,
    whtr,
    whtrRisk,
    whtrStatus,
    bmr,
    tdee,
    targetCalories,
  };
}

export function calculateMacros(
  input: PatientInput,
  targetCalories: number
): MacroSuggestion {
  const proteinPerKg =
    input.goal === 'vitalidad' ? 1.8 : input.goal === 'metabolico' ? 1.6 : 1.3;
  const proteinGrams = Math.round(input.weightKg * proteinPerKg);
  const proteinKcal = proteinGrams * 4;

  const fatsPctTarget = input.goal === 'metabolico' ? 0.3 : 0.28;
  const fatsKcal = Math.round(targetCalories * fatsPctTarget);
  const fatsGrams = Math.round(fatsKcal / 9);

  const remainingKcal = Math.max(200, targetCalories - proteinKcal - fatsKcal);
  const carbsGrams = Math.round(remainingKcal / 4);
  const fiberGrams = Math.round((targetCalories / 1000) * 14);

  const totalKcal = proteinKcal + fatsGrams * 9 + carbsGrams * 4;

  return {
    proteinGrams,
    carbsGrams,
    fatsGrams,
    fiberGrams,
    proteinPct: Math.round((proteinKcal / totalKcal) * 100),
    carbsPct: Math.round(((carbsGrams * 4) / totalKcal) * 100),
    fatsPct: Math.round(((fatsGrams * 9) / totalKcal) * 100),
  };
}

export function suggestMicronutrients(
  input: PatientInput
): MicronutrientSuggestion[] {
  const isOlderAdult = input.age >= 51;
  const isFemale = input.sex === 'femenino';

  const ironMg = isFemale && !isOlderAdult ? '18 mg' : '8 mg';
  const calciumMg =
    (isFemale && isOlderAdult) || input.age >= 71 ? '1200 mg' : '1000 mg';
  const vitDMcg = input.age >= 71 ? '20 mcg (800 UI)' : '15 mcg (600 UI)';
  const vitCMg = isFemale ? '75 mg' : '90 mg';
  const magnesiumMg = isFemale ? '320 mg' : '420 mg';
  const zincMg = isFemale ? '8 mg' : '11 mg';
  const potassiumMg = isFemale ? '2600 mg' : '3400 mg';

  return [
    {
      name: 'Vitamina D',
      amount: vitDMcg,
      role: 'Salud ósea e inmunológica',
      foodSource: 'Salmón, yema de huevo, lácteos fortificados',
    },
    {
      name: 'Vitamina C',
      amount: vitCMg,
      role: 'Síntesis de colágeno y absorción de hierro',
      foodSource: 'Guayaba, pimiento rojo, kiwi, cítricos',
    },
    {
      name: 'Hierro',
      amount: ironMg,
      role: 'Transporte de oxígeno y energía celular',
      foodSource: 'Lentejas, espinaca, carnes magras',
    },
    {
      name: 'Calcio',
      amount: calciumMg,
      role: 'Densidad mineral ósea y contracción muscular',
      foodSource: 'Yogur natural, tofu, brócoli, ajonjolí',
    },
    {
      name: 'Magnesio',
      amount: magnesiumMg,
      role: 'Función neuromuscular y control glucémico',
      foodSource: 'Semillas de calabaza, almendras, avena',
    },
    {
      name: 'Zinc',
      amount: zincMg,
      role: 'Reparación tisular e inmunidad',
      foodSource: 'Garbanzos, semillas de cáñamo, mariscos',
    },
    {
      name: 'Potasio',
      amount: potassiumMg,
      role: 'Equilibrio hídrico y presión arterial',
      foodSource: 'Aguacate, plátano, frijol negro, papa',
    },
    {
      name: 'Folato (Vit. B9)',
      amount: '400 mcg',
      role: 'Renovación celular y salud cardiovascular',
      foodSource: 'Hojas verdes, espárragos, edamame',
    },
  ];
}
```

---

## 5. Revisa, valida los cálculos antropométricos y refina en vivo
Duration: 0:05:00

Antes de llevar NutriApp a la nube, verifica su funcionamiento local usando la terminal y el navegador integrado o local.

### Paso 5.1: Ejecutar el servidor local

En la terminal integrada de Antigravity IDE ejecuta:

```bash
npm install
npm run dev
```

Deberías ver:

```text
  VITE v6.x.x  ready in ... ms
  ➜  Local:   http://localhost:5173/
```

### Paso 5.2: Validar escenarios de prueba de un paciente

Abre `http://localhost:5173/` en el navegador y verifica los siguientes casos:

1. **Paciente de prueba 1 (Mujer, 32 años, 62 kg, 165 cm, cintura 74 cm, actividad moderada, mantenimiento):**
   * **IMC esperado:** `22.8` (*Peso saludable*).
   * **ICA esperado:** `0.45` (*Riesgo cardiometabólico bajo*).
   * **Hierro sugerido:** `18 mg` (adulta en edad fértil).
2. **Paciente de prueba 2 (Hombre, 56 años, 88 kg, 174 cm, cintura 98 cm, actividad ligera, control metabólico):**
   * **IMC esperado:** `29.1` (*Sobrepeso*).
   * **ICA esperado:** `0.56` (*Riesgo cardiometabólico moderado*).
   * **Hierro sugerido:** `8 mg`, **Magnesio:** `420 mg`, **Calorías objetivo:** ajuste del 85 % sobre el GET.

Si detectas cualquier desajuste visual en móviles o escritorio, solicita al agente de Antigravity que lo corrija y valida que `npm run build` compile sin errores:

```bash
npm run build
```

Deberías ver `✓ built in ...` generando la carpeta `dist/`. Detén el servidor de desarrollo con `Ctrl+C` si seguía activo.

Positive : **Calidad del diseño:** Verifica con las herramientas de desarrollador del navegador (`F12` -> modo dispositivo móvil) que el formulario del paciente y las 8 tarjetas de micronutrientes se apilen ordenadamente sin desbordamiento horizontal.

---

## 6. Prepara el contenedor y despliega NutriApp en Google Cloud Run
Duration: 0:09:00

En esta sección empaquetarás **NutriApp** en un contenedor optimizado y lo desplegarás en **Google Cloud Run** para obtener una URL HTTPS pública en producción.

### Paso 6.1: Crear `nginx.conf`, `Dockerfile` y `.dockerignore`

Google Cloud Run enruta el tráfico entrante hacia el puerto `8080` del contenedor. Crea los tres archivos de configuración en la raíz del proyecto `~/nutriapp`.

1. Crea `nginx.conf`:

```bash
cat << 'EOF' > nginx.conf
server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
```

2. Crea `Dockerfile`:

```bash
cat << 'EOF' > Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
EOF
```

3. Crea `.dockerignore`:

```bash
cat << 'EOF' > .dockerignore
node_modules
dist
.git
.env
.env.*
EOF
```

### Paso 6.2: Configurar el proyecto de GCP y habilitar APIs

En la terminal de Antigravity, autentícate con Google Cloud, selecciona (o crea) tu proyecto y habilita las APIs necesarias. Reemplaza `TU_PROJECT_ID` con el ID de tu proyecto de Google Cloud:

```bash
gcloud auth login
export PROJECT_ID="TU_PROJECT_ID"
export REGION="us-central1"

gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

Deberías ver `Operation "operations/..." finished successfully.`.

Negative : **Requisito de facturación:** Asegúrate de que `TU_PROJECT_ID` tenga una cuenta de facturación vinculada en [Google Cloud Console > Billing](https://console.cloud.google.com/billing). Sin facturación activa, Cloud Build y Cloud Run rechazarán el despliegue.

### Paso 6.3: Desplegar NutriApp en Google Cloud Run

Ejecuta el siguiente comando desde la raíz de `~/nutriapp` para construir la imagen con Cloud Build a partir de tu `Dockerfile` y desplegarla en Cloud Run:

```bash
gcloud run deploy nutriapp \
  --source . \
  --platform managed \
  --region us-central1 \
  --port 8080 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3
```

Si es la primera vez que despliegas desde código fuente en esa región, `gcloud` te pedirá confirmar la creación del repositorio `cloud-run-source-deploy` en Artifact Registry: escribe `Y` y presiona `Enter`.

*(Opcional en Antigravity IDE)*: Si tienes instalado el **Google Cloud Developer Plugin** (`agy plugin install google-cloud-developer`), también puedes pedirle directamente al agente: *"Despliega NutriApp en Cloud Run en us-central1 usando el Dockerfile en el puerto 8080 con acceso público"*, revisando y aprobando el plan antes de ejecutar.

### Paso 6.4: Verificar la URL en vivo

Al finalizar la compilación (1 a 3 minutos), deberías ver en pantalla:

```text
Done.
Service [nutriapp] revision [nutriapp-00001-xxx] has been deployed and is serving 100 percent of traffic.
Service URL: https://nutriapp-xxxxxxxxxx-uc.a.run.app
```

Comprueba que el servicio responda con estado `200 OK` y ábrelo en tu navegador:

```bash
export NUTRIAPP_URL=$(gcloud run services describe nutriapp --region us-central1 --format="value(status.url)")
echo "NutriApp en vivo: $NUTRIAPP_URL"
curl -I $NUTRIAPP_URL
```

Abre `$NUTRIAPP_URL` en tu navegador, ingresa los datos de un paciente y confirma que los cálculos antropométricos, macros y micronutrientes operan correctamente sobre HTTPS.

---

## 7. Limpieza de recursos y próximos pasos
Duration: 0:02:00

Si no necesitas mantener el servicio publicado tras concluir las pruebas, elimina los recursos para evitar costos de almacenamiento de imágenes en Artifact Registry.

### Paso 7.1: Eliminar el servicio de Cloud Run y el repositorio de imágenes

```bash
gcloud run services delete nutriapp --region us-central1 --quiet

gcloud artifacts repositories delete cloud-run-source-deploy \
  --location=us-central1 \
  --quiet
```

Deberías ver `Deleted service [nutriapp].` y la confirmación de borrado del repositorio en Artifact Registry.

### Resumen y próximos pasos

En menos de 50 minutos lograste:

* Diseñar **NutriApp** en **Google Stitch** con una estética clínica limpia.
* Conectar Stitch con **Antigravity IDE** mediante **Stitch MCP** y `stitch-skills`.
* Generar lógica antropométrica y nutricional real (IMC, ICA, TMB, GET, macros y micronutrientes) en React + TypeScript.
* Empaquetar la aplicación con Docker + Nginx en el puerto `8080` y desplegarla en producción en **Google Cloud Run**.

Como siguiente paso, puedes versionar este repositorio en **GitHub**, habilitar **Continuous Deployment** en Cloud Run para desplegar en cada `git push`, o conectar un backend seguro en Cloud Run para generar planes semanales de alimentación adaptados a las alergias del paciente.
