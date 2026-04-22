# Sistema de Cotizaciones SELTEL

## Descripción General
Aplicación web desarrollada para la gestión de cotizaciones, permitiendo la creación, edición, visualización y generación automática de documentos en formato PDF. El sistema integra frontend, backend y base de datos, garantizando un flujo completo de información y almacenamiento.

---

## Frontend

### CrearCotizacion.jsx
Componente encargado de la creación y edición de cotizaciones. Permite registrar los datos del cliente, gestionar ítems dinámicos, aplicar cálculos financieros (subtotal, AIU, IVA) y guardar la información en estado borrador o actualizar registros existentes.

### VisualizarCotizaciones.jsx
Vista que permite consultar todas las cotizaciones registradas. Incluye funcionalidades de búsqueda por número, cliente, referencia y fecha, además de filtrado por estado.

### VerCotizacion.jsx
Vista de detalle de una cotización. Permite visualizar la información completa, incluyendo datos del cliente, ítems, cálculos financieros y acceso al documento PDF generado.

### Dashboard.jsx
Vista principal del sistema que permite la navegación entre los diferentes módulos del sistema, facilitando el acceso a la creación y consulta de cotizaciones.

---

## Backend

### cotizaciones.js
Archivo que contiene la lógica de negocio para la gestión de cotizaciones. Incluye operaciones de creación, consulta, actualización y finalización de cotizaciones.

### pdfGenerator.js
Módulo encargado de la generación de documentos PDF. Implementa la estructura del formato de cotización, manejo de tablas dinámicas, soporte multipágina y almacenamiento de archivos en rutas organizadas por fecha.

---

## Base de Datos

El sistema utiliza PostgreSQL para el almacenamiento de la información. Las principales tablas incluyen:

- **cotizaciones**: almacena la información general de cada cotización.
- **cotizacion_items**: contiene los ítems asociados a cada cotización.

---

## Evidencias del Sistema

### Cotizaciones Generadas
Se incluye una carpeta con ejemplos de cotizaciones en formato PDF, evidenciando el funcionamiento del sistema en diferentes escenarios:

- Cotizaciones con distintos números de ítems  
- Cotizaciones con aplicación de AIU  
- Cotizaciones multipágina  

### Evidencias de Búsqueda
Se incluye documentación gráfica donde se evidencia:

- Búsqueda por cliente  
- Búsqueda por referencia  
- Búsqueda por número de cotización  
- Selección de cotización desde la tabla y acceso a sus acciones  

---

## Funcionalidades Principales

- Gestión de cotizaciones (crear, editar, visualizar)  
- Generación automática de documentos PDF  
- Cálculo de valores financieros (Subtotal, AIU, IVA, Total)  
- Filtros y búsqueda avanzada  
- Organización y almacenamiento de documentos  

---

## Autor

Karol Yelena Illera Alfonso
