summary: Aprende a diseñar una aplicación preventiva de salud con Google Stitch, exportarla e integrarla en Antigravity IDE, versionarla en GitHub y desplegarla en producción en Google Cloud Run.
id: orquestando-la-salud-con-antigravity
categories: Cloud, AI, Web, HealthTech
tags: antigravity, stitch, cloud-run, gcp, github, web
status: Published
authors: Maureen Barahona
Feedback Link: https://github.com/

# Orquestando la salud con Antigravity

*Por Maureen Barahona*

## 1. Introducción y Arquitectura del Taller
Duration: 0:05:00

En este codelab construirás y desplegarás en producción una aplicación web de salud preventiva y nutrición llamada **VitalPulse**, siguiendo un flujo moderno de ingeniería asistida por agentes (*Agent-First Development*). Aprenderás a transformar un diseño de interfaz generado con inteligencia artificial en **Google Stitch** en código modular dentro de **Antigravity IDE**, versionarlo en **GitHub** y publicarlo mediante contenedores en **Google Cloud Run** utilizando el **Google Cloud Developer Plugin**.

### Qué construirás

Una aplicación web interactiva y responsiva enfocada en prevención metabólica y hábitos diarios saludables que incluye:

* **Calculadora de Hidratación Personalizada:** Estima la ingesta diaria recomendada de agua (en mililitros y vasos) a partir del peso corporal, nivel de actividad física y temperatura ambiental.
* **Estimador de Macronutrientes Preventivos:** Calcula la distribución diaria equilibrada de proteínas, carbohidratos complejos, fibra y grasas saludables según el objetivo preventivo del usuario (mantenimiento metabólico, control glucémico o vitalidad activa).
* **Chequeo Rápido de Alimentos:** Selector e inspector visual de alimentos comunes con indicador tipo semáforo preventivo (óptimo, moderado, limitar) y registro en el balance del día.

### Objetivos de aprendizaje

Al finalizar este taller serás capaz de:

1. Configurar un proyecto de Google Cloud Platform (GCP) desde cero, habilitando APIs y permisos de mínimo privilegio mediante `gcloud` CLI.
2. Diseñar interfaces web accesibles en **Google Stitch** y conectarlas con **Antigravity IDE** mediante el servidor **Stitch MCP (Model Context Protocol)**.
3. Orquestar agentes en Antigravity para generar, inspeccionar y validar localmente código React + TypeScript + Tailwind CSS.
4. Contenerizar una aplicación web estática con `Dockerfile` y Nginx escuchando en el puerto `8080`, versionándola en **GitHub**.
5. Instalar, autenticar y utilizar el **Google Cloud Developer Plugin** dentro de Antigravity para desplegar con barreras de seguridad en **Google Cloud Run**.

### Arquitectura de extremo a extremo

El flujo completo conecta diseño, desarrollo agéntico, control de versiones e infraestructura serverless:

```text
+-------------------+       Stitch MCP        +-------------------------+
|   Google Stitch   | ----------------------> |    Antigravity IDE      |
| (Diseño UI/UX AI) |   (API Key + Contexto)  | (Agentes + Código Local)|
+-------------------+                         +------------+------------+
                                                           |
                                   git push                | Google Cloud
                         +---------------------------------+ Developer Plugin
                         |                                 | (IAM + Guardrails)
                         v                                 v
               +-------------------+             +----------------------+
               |      GitHub       | ----------> |  Google Cloud Build  |
               | (Repositorio Git) |  (CD Trigger)|  & Artifact Registry |
               +-------------------+             +----------+-----------+
                                                            |
                                                            v
                                                 +----------------------+
                                                 |   Google Cloud Run   |
                                                 | (HTTPS URL Pública)  |
                                                 +----------------------+
```

### Requisitos previos

Antes de comenzar, asegúrate de contar con lo siguiente:

* **Cuenta de Google Cloud Platform (GCP):** Con una cuenta de facturación (*Billing Account*) activa. Si eres usuario nuevo, Google Cloud ofrece créditos iniciales gratuitos.
* **Cuenta de GitHub:** Activa y con acceso para crear repositorios públicos o privados.
* **Acceso a Google Stitch:** Navegador web con sesión iniciada en [https://stitch.withgoogle.com](https://stitch.withgoogle.com).
* **Antigravity IDE instalado:** Descargado e instalado en tu equipo local junto con su CLI (`agy`).
* **Herramientas locales instaladas en tu terminal:**
  * `git` (versión 2.30 o superior).
  * `node` y `npm` (Node.js 20 LTS o superior).
  * `gcloud` (Google Cloud CLI actualizada).
  * `gh` (GitHub CLI, opcional pero recomendada para crear repositorios desde la terminal).

Positive : **Tip de organización:** Crea una carpeta dedicada en tu equipo (por ejemplo `~/talleres/orquestando-salud`) y mantén abiertas tres pestañas en tu navegador: la Consola de Google Cloud, Google Stitch y GitHub. Esto agilizará la copia de identificadores y la verificación de recursos.

---

## 2. Configuración del Entorno en Google Cloud Platform (GCP)
Duration: 0:10:00

En esta sección crearás un proyecto aislado en Google Cloud, verificarás que tenga facturación asociada, habilitarás únicamente las APIs necesarias para compilar y ejecutar contenedores en Cloud Run y asignarás los permisos IAM correspondientes.

### Paso 2.1: Crear el proyecto en Google Cloud Console

1. Abre tu navegador e ingresa a [https://console.cloud.google.com/](https://console.cloud.google.com/).
2. Inicia sesión con tu cuenta de Google.
3. En la barra superior azul/blanca, haz clic en el **selector de proyectos** ubicado a la derecha del logotipo de Google Cloud.
4. En el modal que aparece, haz clic en el botón **New Project** (Proyecto nuevo) en la esquina superior derecha.
5. Completa los campos del formulario:
   * **Project name:** `orquestando-salud-lab`
   * **Project ID:** Haz clic en **Edit** si deseas personalizarlo, o anota el identificador único autogenerado (por ejemplo, `orquestando-salud-lab-4821`). *Nota: El Project ID debe ser globalmente único en todo GCP.*
   * **Location / Organization:** Déjalo en `No organization` o selecciona tu organización si trabajas con una cuenta corporativa.
6. Haz clic en **Create**.
7. Espera entre 10 y 20 segundos. Verás una notificación en la campana superior derecha indicando que el proyecto fue creado. Haz clic en **SELECT PROJECT** dentro de la notificación (o vuelve al selector superior y elige `orquestando-salud-lab`).

### Paso 2.2: Verificar la facturación activa

Cloud Run, Cloud Build y Artifact Registry requieren una cuenta de facturación vinculada, incluso cuando el consumo permanezca dentro de la capa gratuita (*Free Tier*).

1. Haz clic en el **Menú de navegación** (ícono de tres líneas horizontales `☰` en la esquina superior izquierda).
2. Selecciona **Billing** (Facturación).
3. Si aparece el mensaje *"This project has no billing account"*, haz clic en **LINK A BILLING ACCOUNT**, selecciona tu cuenta de facturación activa en el menú desplegable y confirma con **SET ACCOUNT**.
4. Deberías ver el panel **Billing overview** mostrando que la cuenta de facturación está vinculada a `orquestando-salud-lab`.

Negative : **Advertencia de costos:** Aunque Cloud Run ofrece un nivel gratuito generoso (2 millones de solicitudes mensuales y escala a cero cuando no hay tráfico), es obligatorio limpiar los recursos al finalizar este taller en la Sección 8 para evitar cualquier cargo residual de almacenamiento de imágenes en Artifact Registry.

### Paso 2.3: Configurar la terminal local o Cloud Shell

Puedes ejecutar los siguientes comandos en tu **terminal local** (si tienes `gcloud` instalado) o directamente en **Cloud Shell** haciendo clic en el ícono `>_` (**Activate Cloud Shell**) en la barra superior derecha de la consola de GCP.

Si usas tu terminal local, autentica la CLI de Google Cloud ejecutando:

```bash
gcloud auth login
```

Se abrirá una pestaña del navegador. Selecciona la cuenta de Google propietaria del proyecto y haz clic en **Allow**. En la terminal deberías ver:

```text
You are now logged in as [tu-correo@gmail.com].
```

Configura también las Credenciales Predeterminadas de Aplicación (*Application Default Credentials* o ADC), necesarias para que los agentes locales y herramientas interactúen con GCP de forma segura sin descargar llaves JSON:

```bash
gcloud auth application-default login
```

A continuación, define variables de entorno para tu sesión actual y fija el proyecto activo. Reemplaza `TU_PROJECT_ID` con el ID exacto que creaste en el Paso 2.1:

```bash
export PROJECT_ID="TU_PROJECT_ID"
export REGION="us-central1"

gcloud config set project $PROJECT_ID
gcloud config set run/region $REGION
```

Deberías ver en pantalla exactamente:

```text
Updated property [core/project].
Updated property [run/region].
```

Verifica que el proyecto activo sea el correcto:

```bash
gcloud config get-value project
```

Debería imprimir tu `TU_PROJECT_ID`.

### Paso 2.4: Habilitar las APIs necesarias de GCP

Para compilar contenedores desde código fuente, almacenar imágenes y desplegar servicios serverless en Cloud Run, habilita las cuatro APIs requeridas con el siguiente comando:

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com
```

Este proceso puede tardar entre 20 y 45 segundos. Al concluir, deberías ver un mensaje similar a:

```text
Operation "operations/acf.p2-..." finished successfully.
```

Confirma que las cuatro APIs estén activas listando los servicios habilitados:

```bash
gcloud services list --enabled --filter="NAME:(run.googleapis.com OR cloudbuild.googleapis.com OR artifactregistry.googleapis.com OR iam.googleapis.com)"
```

Deberías ver una tabla con las cuatro filas (`artifactregistry.googleapis.com`, `cloudbuild.googleapis.com`, `iam.googleapis.com` y `run.googleapis.com`).

### Paso 2.5: Verificar y configurar permisos IAM

Para desplegar servicios en Cloud Run y ejecutar compilaciones con Cloud Build, tu usuario necesita permisos de administración sobre Cloud Run, compilación y actuación sobre la cuenta de servicio de ejecución.

1. Obtén el correo de tu usuario activo y el número del proyecto:

```bash
export USER_EMAIL=$(gcloud config get-value account)
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

echo "Usuario activo: $USER_EMAIL"
echo "Número de proyecto: $PROJECT_NUMBER"
```

2. Si creaste el proyecto con tu propia cuenta, ya posees el rol `roles/owner`. Sin embargo, si trabajas en un proyecto compartido o deseas aplicar roles explícitos de trabajo para despliegue, ejecuta:

```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$USER_EMAIL" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$USER_EMAIL" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$USER_EMAIL" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="user:$USER_EMAIL" \
  --role="roles/artifactregistry.writer"
```

3. Asegúrate también de que la cuenta de servicio predeterminada de Compute Engine (que Cloud Build y Cloud Run utilizan para compilar desde el código fuente en proyectos recientes) cuente con permisos para escribir en Artifact Registry y registros:

```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"
```

Tras cada comando `add-iam-policy-binding`, deberías ver la salida YAML con `bindings:` y `etag:` confirmando que la política fue actualizada sin errores.

Negative : **Buena práctica de seguridad IAM:** Nunca descargues archivos `.json` de claves privadas de cuentas de servicio (*Service Account Keys*) para desarrollo local. El flujo con `gcloud auth application-default login` y roles IAM temporales evita fugas de credenciales en repositorios Git.

---

## 3. Diseño de la Interfaz con Google Stitch (Design-to-Code)
Duration: 0:12:00

En esta sección utilizarás **Google Stitch** para generar la arquitectura visual, sistema de diseño y pantallas de nuestra aplicación de salud preventiva **VitalPulse**, y prepararás el proyecto para conectarlo directamente con Antigravity IDE.

### Paso 3.1: Ingresar a Google Stitch y crear el proyecto

1. Abre una nueva pestaña en tu navegador y navega a [https://stitch.withgoogle.com](https://stitch.withgoogle.com).
2. Haz clic en **Sign in with Google** y selecciona la misma cuenta que utilizas para tu entorno de desarrollo.
3. En la pantalla principal de tu espacio de trabajo, haz clic en el botón **New Project** (o el selector **+ Create**).
4. Asegúrate de seleccionar el modo **Web** (Desktop & Responsive) en las opciones de lienzo para generar un diseño adaptado a navegador web.

### Paso 3.2: Redactar el prompt maestro de diseño UI/UX

En el cuadro de entrada de Stitch (*Prompt bar*), pega el siguiente prompt detallado. Está optimizado para producir una interfaz clínica, limpia, accesible y sin ruido visual:

```text
Diseña una aplicación web moderna de salud preventiva y nutrición llamada "VitalPulse".
Estilo visual: Limpio, luminoso, clínico y orgánico. Fondo principal en gris ultra claro (#F8FAFC), tarjetas blancas (#FFFFFF) con bordes sutiles (#E2E8F0), color primario verde azulado médico (#0F766E), acento saludable esmeralda (#10B981) y alertas suaves en ámbar (#F59E0B). Tipografía sans-serif moderna y altamente legible con jerarquía clara y contraste accesible WCAG AA.

Estructura de la pantalla principal (Dashboard único responsivo):
1. Barra superior minimalista con el logotipo de VitalPulse, subtítulo "Panel de Salud Preventiva" y selector de objetivo metabólico ("Equilibrio Diario", "Control Glucémico", "Vitalidad Activa").
2. Sección superior de resumen con 3 tarjetas KPI: Hidratación Actual (ml / meta), Balance de Macronutrientes (%) y Puntuación Preventiva del Día (0-100).
3. Columna izquierda: Tarjeta interactiva "Calculadora de Hidratación" con controles deslizantes para Peso (kg), Minutos de actividad física y Clima (Templado/Cálido), un indicador circular de progreso en ml y botones rápidos "+250 ml (1 vaso)" y "+500 ml (botella)".
4. Columna derecha: Tarjeta "Distribución de Macronutrientes Preventivos" con barras de progreso horizontales para Proteína (g), Carbohidratos Complejos (g), Fibra (g) y Grasas Saludables (g), más un panel inferior de "Chequeo Rápido de Alimentos" con botones para evaluar e incorporar alimentos de ejemplo (ej. Aguacate, Avena integral, Salmón, Bebida azucarada) mostrando un semáforo nutricional (Óptimo, Moderado, Limitar).
```

Haz clic en **Generate** (ícono de flecha o enviar) y espera entre 20 y 40 segundos. Deberías ver aparecer en el lienzo de Stitch la pantalla diseñada con el sistema de colores, tipografía y tarjetas solicitadas.

### Paso 3.3: Iterar sobre los componentes y accesibilidad

Una vez generada la primera versión en el lienzo de Stitch:

1. Haz clic sobre la pantalla generada para abrir el panel de edición e inspección.
2. Verifica visualmente que las etiquetas numéricas (`ml`, `g`, `%`) tengan tamaño suficiente y buen contraste frente al fondo blanco.
3. Si deseas refinar un detalle, escribe en el chat de iteración de la pantalla seleccionada:

```text
Aumenta el contraste de los textos secundarios a gris pizarra oscuro (#334155), añade estados hover claros en los botones "+250 ml" y "+500 ml", y asegúrate de que el semáforo nutricional en "Chequeo Rápido de Alimentos" muestre etiquetas de texto ("Óptimo", "Moderado", "Limitar") además del color para garantizar accesibilidad.
```

4. Confirma la actualización y revisa la nueva variante en el lienzo.
5. Cambia el título del proyecto en la barra superior de Stitch a `VitalPulse Salud Preventiva`.

Positive : **Tip de diseño en HealthTech:** Incluir siempre texto descriptivo junto a los códigos de color (como "Óptimo" junto al verde o "Limitar" junto al ámbar) cumple con principios de accesibilidad para personas con daltonismo y mejora la claridad clínica.

### Paso 3.4: Obtener el Project ID y la API Key de Stitch

Para que Antigravity IDE lea directamente tus pantallas, tokens de color y diseño desde Stitch mediante el protocolo MCP, necesitas dos datos: el **Stitch Project ID** y tu **Stitch API Key**.

1. **Obtener el Stitch Project ID:**
   * Observa la barra de direcciones de tu navegador mientras estás dentro de tu proyecto en Stitch. La URL tendrá un formato similar a: `https://stitch.withgoogle.com/projects/1234567890abcdef`.
   * Copia la cadena alfanumérica final (`1234567890abcdef`). Ese es tu `STITCH_PROJECT_ID`.
2. **Generar la Stitch API Key:**
   * Haz clic en tu **foto de perfil** en la esquina superior derecha de Stitch.
   * Selecciona **Settings** (Configuración) o **Preferences**.
   * Desplázate hasta la sección **API Keys**.
   * Haz clic en **Create Key** (Crear clave).
   * Copia inmediatamente la clave generada y guárdala temporalmente en un gestor seguro o bloc de notas local.

*(Opcional de respaldo)*: Desde el menú de opciones de la pantalla en Stitch también puedes hacer clic en **Export** -> **Download Code (HTML/CSS/React)** para conservar un respaldo ZIP, aunque en la siguiente sección realizaremos la integración inteligente vía Stitch MCP dentro de Antigravity.

Negative : **Seguridad de credenciales:** Trata tu `STITCH_API_KEY` como una contraseña. Nunca la pegues dentro de archivos fuente (`src/`) ni la subas a GitHub. Solo se configurará en el entorno privado MCP de Antigravity.

---

## 4. Exportación e Integración del Prototipo en Antigravity IDE
Duration: 0:15:00

En esta sección abrirás tu espacio de trabajo en **Antigravity IDE**, conectarás el servidor **Stitch MCP** y guiarás al agente para convertir el diseño de Stitch en una aplicación web funcional en React + TypeScript + Vite + Tailwind CSS.

### Paso 4.1: Preparar la carpeta local y abrir Antigravity IDE

1. En tu terminal local, crea la carpeta del proyecto e ingresa en ella:

```bash
mkdir -p ~/talleres/orquestando-salud
cd ~/talleres/orquestando-salud
```

2. Abre **Antigravity IDE** en esa carpeta ejecutando el comando CLI `agy` (o abriendo la aplicación Antigravity desde tu sistema operativo y seleccionando **File** -> **Open Folder...** -> `~/talleres/orquestando-salud`):

```bash
agy .
```

Deberías ver la ventana principal de Antigravity IDE con el explorador de archivos vacío a la izquierda y el panel del **Agent** (Chat agéntico) a la derecha.

### Paso 4.2: Configurar el Stitch MCP Server en Antigravity

Conecta Antigravity con tu cuenta de Google Stitch mediante el Model Context Protocol (MCP):

#### Opción A: Mediante la interfaz gráfica de Antigravity (Recomendada)

1. En la barra lateral de Antigravity, haz clic en el ícono de **Customizations** (o haz clic en el menú `...` -> **MCP Servers** en la parte superior del panel de Agentes).
2. Haz clic en **Manage MCP Servers** -> **Add MCP Server (+)** (o busca en el catálogo de servidores MCP).
3. Selecciona **Stitch MCP** en la lista disponible.
4. Cuando te solicite las credenciales, pega la **Stitch API Key** que copiaste en el Paso 3.4 y haz clic en **Save / Install**.

#### Opción B: Configuración manual mediante `mcp_config.json`

Si prefieres configurarlo manualmente o estás en un entorno headless:

1. En el panel de **MCP Servers** haz clic en **View raw config** (`mcp_config.json`).
2. Agrega el bloque `stitch` reemplazando `TU_STITCH_API_KEY`:

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@_davideast/stitch-mcp", "proxy"],
      "env": {
        "STITCH_API_KEY": "TU_STITCH_API_KEY"
      }
    }
  }
}
```

3. Guarda el archivo (`Cmd+S` / `Ctrl+S`) y haz clic en el botón **Refresh** junto a los servidores MCP para verificar que aparezca el indicador verde de conexión activa.

#### Verificar la conexión con Stitch

1. Abre el panel **Agent Chat** en Antigravity.
2. Escribe el siguiente prompt y presiona `Enter`:

```text
List my Stitch projects
```

3. El agente invocará la herramienta del servidor MCP de Stitch y deberías ver en pantalla una respuesta listando tu proyecto **VitalPulse Salud Preventiva** junto con su **Project ID**.

### Paso 4.3: Generar el código desde el diseño de Stitch

Ahora indica al agente de Antigravity que importe el diseño exacto de Stitch y construya una aplicación web funcional con lógica real de salud preventiva. Reemplaza `TU_STITCH_PROJECT_ID` por el ID obtenido en el paso anterior:

```text
Usa el servidor Stitch MCP para inspeccionar el proyecto con ID "TU_STITCH_PROJECT_ID" (VitalPulse Salud Preventiva).
Implementa una aplicación web completa y lista para producción usando React, Vite, TypeScript y Tailwind CSS v4.

Requisitos técnicos y funcionales:
1. Respeta fielmente la paleta de colores (#F8FAFC, #0F766E, #10B981, #F59E0B), jerarquía tipográfica y distribución de tarjetas obtenidas desde Stitch.
2. Crea un módulo puro en `src/utils/healthFormulas.ts` con funciones tipadas para:
   - Calcular la meta diaria de hidratación en ml: (pesoKg * 35) + (minutosActividad * 12) + (climaCalido ? 400 : 0).
   - Calcular macronutrientes preventivos según el objetivo ("Equilibrio Diario", "Control Glucémico", "Vitalidad Activa").
   - Calcular la Puntuación Preventiva del Día (0 a 100) combinando adherencia de agua y calidad del semáforo de alimentos registrados.
3. Implementa interactividad real en estado de React: los sliders, botones "+250 ml" / "+500 ml", selector de objetivo y "Chequeo Rápido de Alimentos" deben recalcular todos los KPIs en tiempo real.
4. No uses `window.alert`, no incluyas claves de API ni llamadas a servicios externos que requieran secretos.
```

Observa cómo el agente de Antigravity elabora un plan de implementación, descarga los metadatos de diseño de Stitch y genera los archivos del proyecto. Si el agente solicita permiso para ejecutar `npm create` o instalar paquetes, haz clic en **Approve** (Aprobar).

### Paso 4.4: Revisar la estructura de archivos y validar la lógica

Una vez que el agente finalice, abre el explorador de archivos en Antigravity y verifica que tengas una estructura equivalente a la siguiente:

```text
orquestando-salud/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── index.css
    ├── main.tsx
    ├── App.tsx
    └── utils/
        └── healthFormulas.ts
```

Verifica el contenido de `package.json` para confirmar que incluye React, Vite, Tailwind CSS y TypeScript. Si deseas asegurarte de contar con las fórmulas preventivas exactas, revisa o actualiza `src/utils/healthFormulas.ts` para que contenga la siguiente lógica determinista:

```typescript
export type MetabolicGoal = 'equilibrio' | 'glucemico' | 'vitalidad';
export type FoodRating = 'optimo' | 'moderado' | 'limitar';

export interface MacroTargets {
  proteinGrams: number;
  complexCarbsGrams: number;
  fiberGrams: number;
  healthyFatsGrams: number;
  totalKcal: number;
}

export interface FoodItem {
  id: string;
  name: string;
  portion: string;
  rating: FoodRating;
  fiberGrams: number;
  proteinGrams: number;
  note: string;
}

export function calculateHydrationGoalMl(
  weightKg: number,
  activityMinutes: number,
  isWarmClimate: boolean
): number {
  const baseMl = Math.max(30, weightKg) * 35;
  const activityMl = Math.max(0, activityMinutes) * 12;
  const climateMl = isWarmClimate ? 400 : 0;
  return Math.round((baseMl + activityMl + climateMl) / 50) * 50;
}

export function calculateMacroTargets(
  weightKg: number,
  goal: MetabolicGoal
): MacroTargets {
  const safeWeight = Math.max(35, weightKg);
  let proteinFactor = 1.2;
  let carbFactor = 2.6;
  let fatFactor = 0.85;
  let fiberTarget = 30;

  if (goal === 'glucemico') {
    proteinFactor = 1.4;
    carbFactor = 1.9;
    fatFactor = 0.95;
    fiberTarget = 36;
  } else if (goal === 'vitalidad') {
    proteinFactor = 1.6;
    carbFactor = 3.2;
    fatFactor = 0.9;
    fiberTarget = 32;
  }

  const proteinGrams = Math.round(safeWeight * proteinFactor);
  const complexCarbsGrams = Math.round(safeWeight * carbFactor);
  const healthyFatsGrams = Math.round(safeWeight * fatFactor);
  const totalKcal =
    proteinGrams * 4 + complexCarbsGrams * 4 + healthyFatsGrams * 9;

  return {
    proteinGrams,
    complexCarbsGrams,
    fiberGrams: fiberTarget,
    healthyFatsGrams,
    totalKcal,
  };
}

export function calculatePreventiveScore(
  consumedMl: number,
  goalMl: number,
  loggedFoods: FoodItem[]
): number {
  const hydrationRatio = Math.min(1, consumedMl / Math.max(1, goalMl));
  const hydrationPoints = hydrationRatio * 55;

  if (loggedFoods.length === 0) {
    return Math.round(hydrationPoints);
  }

  const foodSum = loggedFoods.reduce((acc, item) => {
    if (item.rating === 'optimo') return acc + 15;
    if (item.rating === 'moderado') return acc + 8;
    return acc - 5;
  }, 0);

  const boundedFoodPoints = Math.max(0, Math.min(45, foodSum));
  return Math.min(100, Math.round(hydrationPoints + boundedFoodPoints));
}
```

Asegúrate también de que el script `build` en `package.json` genere la carpeta `dist/` limpiamente mediante TypeScript y Vite:

```json
{
  "name": "vitalpulse-orquestando-salud",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.475.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.2",
    "vite": "^6.1.0"
  }
}
```

### Paso 4.5: Instalar dependencias y probar en servidor local

Abre la terminal integrada dentro de Antigravity IDE (`Ctrl+\`` o menú **Terminal** -> **New Terminal**) y ejecuta:

```bash
npm install
```

Deberías ver el resumen de paquetes instalados sin errores (`added ... packages`).

Inicia el servidor de desarrollo local:

```bash
npm run dev
```

Deberías ver una salida similar a:

```text
  VITE v6.1.0  ready in 320 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Abre `http://localhost:5173/` en tu navegador y valida manualmente las siguientes interacciones antes de pasar a producción:

1. Ajusta el control deslizante de peso a `70 kg`, actividad a `45 min` y activa clima cálido: la meta de hidratación debe actualizarse automáticamente a `3400 ml`.
2. Haz clic en **+250 ml (1 vaso)** y **+500 ml (botella)**: el progreso circular y la Puntuación Preventiva deben aumentar de inmediato.
3. Cambia el selector de objetivo a **Control Glucémico**: las barras de carbohidratos complejos y fibra deben recalcularse.
4. Registra un alimento en **Chequeo Rápido de Alimentos** y verifica que aparezca la etiqueta de semáforo correspondiente.

Detén el servidor local presionando `Ctrl+C` en la terminal de Antigravity.

Positive : **Verificación anticipada:** Ejecuta `npm run build` ahora mismo para confirmar que la compilación de TypeScript y Vite no tiene errores antes de empaquetar en Docker. Deberías ver `dist/index.html` y `✓ built in ...ms`.

---

## 5. Control de Versiones: Creación y Subida del Repositorio en GitHub
Duration: 0:10:00

Antes de desplegar a la nube, prepararás el proyecto con su configuración de exclusiones (`.gitignore`), su contenedor de producción (`Dockerfile` configurado para el puerto `8080` requerido por Cloud Run) y lo subirás a un repositorio en **GitHub**.

### Paso 5.1: Crear `.gitignore` y `.dockerignore`

Crea el archivo `.gitignore` en la raíz del proyecto para evitar subir dependencias pesadas, artefactos compilados o archivos de entorno sensibles:

```bash
cat << 'EOF' > .gitignore
# Dependencias y compilación
node_modules/
dist/
build/

# Archivos de entorno y secretos
.env
.env.local
.env.*.local
*.pem
*.key

# Logs y cachés
npm-debug.log*
.vite/
.DS_Store
Thumbs.db
EOF
```

Crea también `.dockerignore` para que Cloud Build no envíe `node_modules` ni el historial `.git` al construir el contenedor, acelerando el despliegue:

```bash
cat << 'EOF' > .dockerignore
node_modules
dist
.git
.gitignore
.env
.env.*
README.md
EOF
```

### Paso 5.2: Configurar Nginx y el `Dockerfile` para Google Cloud Run

Google Cloud Run espera que los contenedores escuchen tráfico HTTP en el puerto definido por la variable de entorno `PORT` (cuyo valor predeterminado es `8080`). Como nuestra aplicación es una Single Page Application (SPA) compilada con Vite, utilizaremos un **build multi-etapa** con Node.js para compilar y Nginx Alpine para servir los archivos estáticos de manera ultra ligera.

1. Crea el archivo `nginx.conf` en la raíz del proyecto:

```nginx
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

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

2. Crea el archivo `Dockerfile` en la raíz del proyecto:

```dockerfile
# Etapa 1: Compilación de la aplicación React + Vite
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Servidor web ligero para producción en Cloud Run
FROM nginx:1.27-alpine AS runner

# Eliminar configuración por defecto que escucha en el puerto 80
RUN rm -f /etc/nginx/conf.d/default.conf

# Copiar configuración personalizada escuchando en el puerto 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos estáticos compilados desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

3. Comprueba que la compilación local siga intacta ejecutando:

```bash
npm run build
```

Deberías ver `✓ built in ...` sin errores de TypeScript.

### Paso 5.3: Inicializar Git y verificar archivos rastreados

Inicializa el repositorio Git local en la rama principal `main`:

```bash
git init
git branch -M main
git status
```

Deberías ver listados en rojo (`Untracked files`) archivos como `Dockerfile`, `nginx.conf`, `.gitignore`, `.dockerignore`, `package.json`, `index.html`, `src/`, etc. **Confirma que no aparezca `node_modules/` ni ningún archivo `.env`**.

### Paso 5.4: Crear el repositorio en GitHub

Puedes elegir entre la vía rápida por terminal con GitHub CLI (`gh`) o la interfaz web de GitHub.

#### Opción A: Usando GitHub CLI (`gh`)

1. Si aún no has iniciado sesión en `gh`, ejecuta:

```bash
gh auth login
```

Selecciona `GitHub.com` -> `HTTPS` -> `Yes` (autenticar Git con tus credenciales de GitHub) -> `Login with a web browser` y completa el código en el navegador.

2. Crea el repositorio remoto y vincula `origin` automáticamente:

```bash
gh repo create orquestando-salud --public --source=. --remote=origin
```

Deberías ver en consola:

```text
✓ Created repository TU_USUARIO/orquestando-salud on github.com
✓ Added remote https://github.com/TU_USUARIO/orquestando-salud.git
```

#### Opción B: Usando la interfaz web de GitHub

1. Ingresa a [https://github.com/](https://github.com/) e inicia sesión.
2. Haz clic en el botón **`+`** en la esquina superior derecha y selecciona **New repository**.
3. En **Repository name** escribe `orquestando-salud`.
4. Selecciona visibilidad **Public** (o **Private**). **No** marques *Add a README file* ni *.gitignore*, ya que el proyecto local ya los contiene.
5. Haz clic en **Create repository**.
6. Copia la URL HTTPS mostrada en pantalla (`https://github.com/TU_USUARIO/orquestando-salud.git`) y ejecuta en tu terminal (reemplazando `TU_USUARIO`):

```bash
git remote add origin https://github.com/TU_USUARIO/orquestando-salud.git
git remote -v
```

Deberías ver `origin` apuntando a tu repositorio para `fetch` y `push`.

### Paso 5.5: Realizar el primer `commit` y `push` a `main`

Prepara todos los archivos, crea el commit inicial y súbelos a GitHub:

```bash
git add .
git commit -m "feat: aplicacion preventiva VitalPulse desde Stitch con Dockerfile para Cloud Run"
git push -u origin main
```

Deberías ver una salida similar a:

```text
Enumerating objects: 18, done.
Counting objects: 100% (18/18), done.
Delta compression using up to 8 threads
Compressing objects: 100% (16/16), done.
Writing objects: 100% (18/18), ... KiB | ... MiB/s, done.
To https://github.com/TU_USUARIO/orquestando-salud.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

Recarga la página de tu repositorio en GitHub para confirmar que todos los archivos, incluyendo `Dockerfile` y `src/`, ya están publicados en la rama `main`.

Negative : **Revisión obligatoria antes del commit:** Si en algún paso agregaste archivos temporales con claves o tokens, ejecuta `git reset HEAD <archivo>` antes de hacer `git commit` para impedir que queden registrados en el historial de Git.

---

## 6. Instalación y Configuración del Google Cloud Developer Plugin en Antigravity
Duration: 0:08:00

En esta sección equipararás a Antigravity IDE con el plugin oficial **Google Cloud Developer** (`google-cloud-developer`). Este plugin proporciona al agente acceso en tiempo real a documentación oficial de Google Cloud mediante su propio servidor MCP preautorizado (*Developer Knowledge MCP*), validación de comandos `gcloud` y barreras de consentimiento explícito antes de crear o modificar recursos facturables.

### Paso 6.1: Instalar el Google Cloud Developer Plugin

Puedes instalarlo mediante la interfaz gráfica de Antigravity o con un único comando de la CLI `agy`.

#### Opción A: Instalación desde Antigravity Marketplace (UI)

1. Dentro de **Antigravity IDE**, abre el panel **Customizations** en la barra lateral izquierda.
2. Selecciona la pestaña **Plugins** y navega a la categoría **Build with Google**.
3. Localiza la tarjeta **Google Cloud Developer** (`google-cloud-developer`).
4. Haz clic en **Install**.

#### Opción B: Instalación mediante Antigravity CLI (`agy`)

Ejecuta en la terminal integrada de Antigravity:

```bash
agy plugin install google-cloud-developer
```

Verifica que el plugin se haya instalado y activado correctamente listando los plugins disponibles:

```bash
agy plugin list
```

Deberías ver `google-cloud-developer` marcado como instalado/activo en la salida de la terminal.

Positive : **¿Qué obtienes con este plugin?** El servidor *Developer Knowledge MCP* incluido viene preautorizado por defecto (no necesitas configurar nuevas API keys). Además, el plugin bloquea prácticas inseguras como descargar llaves JSON de cuentas de servicio y exige tu confirmación explícita antes de habilitar APIs o desplegar infraestructura.

### Paso 6.2: Vincular tu cuenta de Google y el proyecto de GCP en el entorno de Antigravity

El plugin utiliza tu sesión local de `gcloud` y Application Default Credentials para operar dentro del proyecto configurado en el Paso 2. Confirma desde la terminal integrada de Antigravity que el contexto activo coincide con el proyecto `orquestando-salud-lab`:

```bash
gcloud auth list
gcloud config list
```

Deberías ver una salida similar a:

```text
[core]
account = tu-correo@gmail.com
disable_usage_reporting = False
project = TU_PROJECT_ID

[run]
region = us-central1
```

Si por alguna razón `project` no coincide con el `TU_PROJECT_ID` que creaste en la Sección 2, fíjalo nuevamente:

```bash
gcloud config set project TU_PROJECT_ID
gcloud config set run/region us-central1
```

### Paso 6.3: Verificar la integración del plugin desde el Agent Chat

Abre el **Agent Chat** dentro de Antigravity IDE y escribe el siguiente prompt para comprobar que el **Google Cloud Developer Plugin** reconoce tu proyecto, facturación y APIs:

```text
Usando las herramientas de Google Cloud Developer, verifica cuál es mi proyecto de GCP activo, confirma que la API de Cloud Run (run.googleapis.com), Cloud Build y Artifact Registry estén habilitadas en la región us-central1, e indícame el estado actual de servicios en Cloud Run sin modificar ningún recurso todavía.
```

Deberías ver al agente invocar las habilidades del plugin `google-cloud-developer`, ejecutar comandos de solo lectura (`gcloud services list` / `gcloud run services list`) y responderte con un resumen exacto de tu `TU_PROJECT_ID`, confirmando que las APIs están habilitadas y que actualmente existen `0` servicios desplegados en `us-central1`.

---

## 7. Despliegue Continuo en Google Cloud Run
Duration: 0:12:00

Ahora desplegarás la aplicación preventiva **VitalPulse** en **Google Cloud Run**, primero de forma orquestada desde Antigravity usando el **Google Cloud Developer Plugin** (mostrando también el comando `gcloud` exacto equivalente) y luego configurando la integración de despliegue continuo desde tu repositorio de **GitHub**.

### Paso 7.1: Desplegar en Cloud Run desde Antigravity IDE con el Plugin

En el **Agent Chat** de Antigravity IDE, solicita al agente que construya y despliegue el servicio en Cloud Run siguiendo la configuración de producción de tu `Dockerfile`:

```text
Usa el Google Cloud Developer Plugin para desplegar esta aplicación web en Google Cloud Run dentro de mi proyecto activo:
- Nombre del servicio: orquestando-salud
- Región: us-central1
- Origen de compilación: Dockerfile en la raíz del proyecto (--source .)
- Puerto del contenedor: 8080
- Acceso público: permitir invocaciones sin autenticación (--allow-unauthenticated)
- Límites recomendados para taller: memoria 512Mi, CPU 1, mínimo 0 instancias (scale-to-zero) y máximo 3 instancias.

Muéstrame primero el plan y los comandos exactos antes de ejecutar el despliegue.
```

#### Revisar y aprobar las barreras de seguridad

1. El agente analizará tu `Dockerfile` y `nginx.conf` usando las reglas del **Google Cloud Developer Plugin** y te presentará el plan de ejecución junto con el comando exacto a ejecutar.
2. Como el despliegue crea recursos facturables e invoca Cloud Build, el plugin te pedirá **consentimiento explícito**.
3. Revisa que el proyecto (`TU_PROJECT_ID`), región (`us-central1`) y puerto (`8080`) sean correctos, y haz clic en **Approve / Allow** para iniciar el despliegue.

### Paso 7.2: Comando equivalente directo con `gcloud CLI` (Respaldo)

El comando exacto que ejecuta el agente bajo el capó (y que también puedes ejecutar directamente en la terminal integrada de Antigravity en cualquier momento) es:

```bash
gcloud run deploy orquestando-salud \
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

Descripción de cada parámetro clave:

* `--source .`: Empaqueta tu directorio actual (respetando `.dockerignore`), lo sube a Cloud Build, construye la imagen con tu `Dockerfile` y la guarda en Artifact Registry.
* `--port 8080`: Indica a Cloud Run que el servidor Nginx dentro del contenedor escucha en el puerto `8080`.
* `--allow-unauthenticated`: Configura la política IAM `roles/run.invoker` para `allUsers`, haciendo pública la URL HTTPS de la aplicación web.
* `--min-instances 0`: Habilita *scale-to-zero* para que no consumas cómputo cuando nadie visita la app.

### Paso 7.3: Seguimiento del despliegue y salida esperada

Si es la primera vez que despliegas desde código fuente en esa región, `gcloud` te preguntará si deseas crear el repositorio `cloud-run-source-deploy` en Artifact Registry:

```text
Deploying from source requires an Artifact Registry Docker repository to store built containers. A repository named [cloud-run-source-deploy] in region [us-central1] will be created.
Do you want to continue (Y/n)?
```

Escribe `Y` y presiona `Enter` (si lo ejecutas desde el agente de Antigravity, aprueba la creación del repositorio cuando te lo solicite).

Durante los siguientes 1 a 3 minutos verás las fases en progreso:
1. `Building using Dockerfile and deploying container to Cloud Run service [orquestando-salud]...`
2. `Uploading sources...`
3. `Building Container...` (pasos de Cloud Build ejecutando `npm ci`, `npm run build` y copiando a Nginx).
4. `Creating Revision...`
5. `Routing traffic...`

Al concluir con éxito, **deberías ver en pantalla exactamente este mensaje de confirmación**:

```text
Done.
Service [orquestando-salud] revision [orquestando-salud-00001-xxx] has been deployed and is serving 100 percent of traffic.
Service URL: https://orquestando-salud-xxxxxxxxxx-uc.a.run.app
```

Positive : **Anota tu Service URL:** La URL pública HTTPS asignada por Cloud Run (por ejemplo `https://orquestando-salud-xxxxxxxxxx-uc.a.run.app`) cuenta con certificado TLS administrado automáticamente por Google y balanceo de carga global.

### Paso 7.4: Configurar Despliegue Continuo (CD) conectado a GitHub

Para que cada futuro `git push` a la rama `main` de tu repositorio en GitHub compile y publique automáticamente una nueva revisión en Cloud Run:

1. Abre la Consola de Google Cloud en [https://console.cloud.google.com/run](https://console.cloud.google.com/run).
2. Asegúrate de estar en tu proyecto `orquestando-salud-lab` y haz clic sobre el servicio **`orquestando-salud`**.
3. En la barra superior de acciones del servicio, haz clic en **EDIT & DEPLOY NEW REVISION** o busca la pestaña **INTEGRATIONS / TRIGGERS** -> haz clic en **SET UP CONTINUOUS DEPLOYMENT** (Configurar implementación continua).
4. En el panel lateral **Set up continuous deployment**:
   * **Repository provider:** Selecciona **GitHub** y haz clic en **AUTHENTICATE** si aún no vinculaste tu cuenta de GitHub con Cloud Build. Autoriza la aplicación **Google Cloud Build** en GitHub para tu repositorio `orquestando-salud`.
   * **Repository:** Selecciona `TU_USUARIO/orquestando-salud`.
   * Haz clic en **Next**.
   * **Branch:** Escribe `^main$`.
   * **Build Type:** Selecciona **Dockerfile** (Source location: `/Dockerfile`).
5. Haz clic en **Save**.

A partir de este momento, Cloud Build creará un activador (*Trigger*) automático. Cualquier mejora de diseño que hagas en Stitch e integres en Antigravity se desplegará automáticamente en Cloud Run al ejecutar `git push origin main`.

### Paso 7.5: Verificación de la URL HTTPS pública y pruebas en vivo

Realiza tres comprobaciones para certificar que el servicio en producción funciona al 100%:

1. **Verificación HTTP desde la terminal:** Reemplaza `<TU_SERVICE_URL>` por la URL obtenida en el Paso 7.3:

```bash
export SERVICE_URL=$(gcloud run services describe orquestando-salud --region us-central1 --format="value(status.url)")
echo "Probando servicio en: $SERVICE_URL"
curl -I $SERVICE_URL
```

Deberías ver una cabecera de respuesta `HTTP/2 200` y `content-type: text/html`.

2. **Prueba funcional en el navegador:**
   * Abre `$SERVICE_URL` en una ventana de incógnito de tu navegador.
   * Verifica que el diseño importado desde **Google Stitch** cargue instantáneamente sin errores en la consola del navegador (`F12` -> pestaña **Console**).
   * Interactúa con la **Calculadora de Hidratación**, cambia el objetivo metabólico y registra alimentos en **Chequeo Rápido de Alimentos** para comprobar que todo responde correctamente sobre HTTPS.

3. **Inspección de logs en Cloud Run:**

```bash
gcloud run services logs read orquestando-salud \
  --region us-central1 \
  --limit 20
```

Deberías ver las solicitudes `GET / 200` servidas por Nginx desde tu contenedor en producción.

---

## 8. Limpieza de Recursos y Próximos Pasos
Duration: 0:05:00

Para evitar cargos innecesarios de almacenamiento o tráfico una vez que hayas concluido las pruebas del taller, elimina los recursos creados en Google Cloud Platform.

### Paso 8.1: Eliminar el servicio de Google Cloud Run

Ejecuta el siguiente comando en tu terminal para eliminar el servicio `orquestando-salud` y detener toda exposición pública de la URL:

```bash
gcloud run services delete orquestando-salud \
  --region us-central1 \
  --quiet
```

Deberías ver en pantalla:

```text
Deleting [orquestando-salud]...done.
Deleted service [orquestando-salud].
```

### Paso 8.2: Eliminar el repositorio de imágenes en Artifact Registry

Al compilar con `--source .`, Cloud Build almacenó la imagen Docker compilada en Artifact Registry (`cloud-run-source-deploy`). Elimínala para no pagar almacenamiento mensual:

```bash
gcloud artifacts repositories list --location=us-central1
```

Luego elimina el repositorio creado por el despliegue:

```bash
gcloud artifacts repositories delete cloud-run-source-deploy \
  --location=us-central1 \
  --quiet
```

Deberías ver:

```text
Delete request issued for [cloud-run-source-deploy]
Waiting for operation [projects/.../locations/us-central1/operations/...] to complete...done.
```

### Paso 8.3: (Opcional) Eliminar el proyecto completo de GCP

Si creaste el proyecto `orquestando-salud-lab` exclusivamente para este codelab y deseas asegurarte de eliminar el 100% de los recursos asociados (incluyendo activadores de Cloud Build y buckets temporales):

```bash
gcloud projects delete $PROJECT_ID --quiet
```

Deberías ver `Deleted [https://cloudresourcemanager.googleapis.com/v1/projects/TU_PROJECT_ID].`.

Negative : **Precaución:** Eliminar el proyecto completo marcará todos sus recursos para destrucción definitiva tras el periodo de gracia de GCP. Ejecuta este paso únicamente si no compartes el proyecto con otras aplicaciones.

### Resumen de lo aprendido

¡Felicidades! Has completado el flujo completo de diseño a producción orquestado por agentes:

* Configuraste un entorno seguro en **Google Cloud Platform** habilitando APIs y permisos IAM sin exportar claves JSON.
* Diseñaste una aplicación preventiva de salud y nutrición (**VitalPulse**) en **Google Stitch** aplicando criterios de accesibilidad y claridad clínica.
* Conectaste Stitch con **Antigravity IDE** mediante **Stitch MCP** para transformar el diseño visual en código React + TypeScript funcional y probado en `localhost`.
* Versionaste el proyecto con un `Dockerfile` multi-stage para puerto `8080` y lo publicaste en **GitHub**.
* Instalaste el **Google Cloud Developer Plugin** en Antigravity para desplegar con guardrails de seguridad en **Google Cloud Run** y activar despliegue continuo desde GitHub.

### Próximos pasos

Si deseas continuar evolucionando **VitalPulse**:

* **Análisis visual de alimentos con Gemini:** Agrega un backend ligero en Express (`server.ts`) conectado al SDK `@google/genai` (protegido con Secret Manager en Cloud Run) para analizar fotografías de platos y calcular automáticamente su semáforo nutricional.
* **Persistencia de historial clínico/preventivo:** Integra **Cloud Firestore** o **Cloud SQL** junto con **Firebase Authentication** para que cada usuario guarde su evolución semanal de hidratación y macronutrientes.
* **Dominio personalizado:** Mapea tu propio dominio con certificado TLS automático desde la sección **Manage Custom Domains** en la consola de Google Cloud Run.
