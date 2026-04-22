export interface Activity {
  id: string;
  name: string;
  description: string;
  startDate: string; // ISO format YYYY-MM-DD
  endDate: string;   // ISO format YYYY-MM-DD
  weight: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  activities: Activity[];
}

export const COURSES: Course[] = [
  {
    id: "301305",
    code: "301305",
    name: "Estructuras de Datos",
    activities: [
      { id: "ed-1", name: "Fase 1 - Evaluación del escenario", description: "Identificar requerimientos funcionales.", startDate: "2026-03-31", endDate: "2026-04-13", weight: 25 },
      { id: "ed-2", name: "Fase 2 - Abstracción y Diseño", description: "Desarrollar una aplicación en Python (POO).", startDate: "2026-04-14", endDate: "2026-05-11", weight: 125 },
      { id: "ed-3", name: "Fase 3 - Componente práctico (Simuladas)", description: "Estructuras lineales en memoria.", startDate: "2026-05-12", endDate: "2026-06-16", weight: 150 },
      { id: "ed-4", name: "Fase 4 - Arquitectura de estructuras binarias", description: "Árboles binarios.", startDate: "2026-06-17", endDate: "2026-07-06", weight: 75 },
      { id: "ed-5", name: "Fase 5 - Validación integral y sustentación", description: "Integración de aplicaciones.", startDate: "2026-07-07", endDate: "2026-07-20", weight: 125 }
    ]
  },
  {
    id: "900003",
    code: "900003",
    name: "Inglés B1",
    activities: [
      { id: "i1-1", name: "Task 1 - Pre Learning Adventure", description: "Online test for previous knowledge.", startDate: "2026-03-31", endDate: "2026-04-13", weight: 25 },
      { id: "i1-2", name: "Task 2 - Colombia Summer Travel bucket List", description: "Produce coherent written compositions.", startDate: "2026-04-14", endDate: "2026-05-10", weight: 100 },
      { id: "i1-3", name: "Task 3 - Listening Challenge", description: "Interpret conversations.", startDate: "2026-05-11", endDate: "2026-05-24", weight: 70 },
      { id: "i1-4", name: "Task 4 - Showcasing My Town", description: "Oral presentation and PDF.", startDate: "2026-05-25", endDate: "2026-06-23", weight: 100 },
      { id: "i1-5", name: "Task 5 - Reading Quest", description: "Analyze biographical texts.", startDate: "2026-06-24", endDate: "2026-07-06", weight: 80 },
      { id: "i1-6", name: "Task 6 - Level-up test", description: "Final exam.", startDate: "2026-07-11", endDate: "2026-07-15", weight: 125 }
    ]
  },
  {
    id: "100413",
    code: "100413",
    name: "Física General",
    activities: [
      { id: "fg-1", name: "Tarea 1 - Reconocimiento de saberes", description: "Cuestionario evaluación inicial.", startDate: "2026-03-31", endDate: "2026-04-13", weight: 25 },
      { id: "fg-2", name: "Tarea 2 - Introducción a la física", description: "Ejercicios de cinemática.", startDate: "2026-04-14", endDate: "2026-05-10", weight: 70 },
      { id: "fg-3", name: "Tarea 3 - De las fuerzas al movimiento", description: "Dinámica y leyes de Newton.", startDate: "2026-05-11", endDate: "2026-06-11", weight: 75 },
      { id: "fg-4", name: "Tarea 4 - Energía en transformación", description: "Conservación de la energía.", startDate: "2026-06-12", endDate: "2026-07-10", weight: 65 },
      { id: "fg-5", name: "Tarea 5 - Componente Práctico", description: "Laboratorio presencial.", startDate: "2026-04-14", endDate: "2026-07-10", weight: 140 },
      { id: "fg-6", name: "Tarea 6 - Evaluación Final", description: "Examen 25%.", startDate: "2026-07-11", endDate: "2026-07-11", weight: 125 }
    ]
  },
  {
    id: "80003",
    code: "80003",
    name: "Salud Oral",
    activities: [
      { id: "so-1", name: "Tarea 1 - Contextualización", description: "Cuadro comparativo.", startDate: "2026-03-31", endDate: "2026-04-13", weight: 25 },
      { id: "so-2", name: "Tarea 2 - Reconocimiento anatómico oral", description: "Informe componentes cavidad oral.", startDate: "2026-04-14", endDate: "2026-05-25", weight: 175 },
      { id: "so-3", name: "Tarea 3 - Promoción de la salud oral", description: "Tabla comparativa hábitos higiene.", startDate: "2026-05-26", endDate: "2026-07-10", weight: 175 },
      { id: "so-4", name: "Tarea 4 - Evaluación final", description: "Examen final.", startDate: "2026-07-11", endDate: "2026-07-11", weight: 125 }
    ]
  },
  {
    id: "202016899",
    code: "202016899",
    name: "Diseño de Bases de Datos",
    activities: [
      { id: "dbd-1", name: "Fase 1 - Reconocimiento General", description: "Identificar conceptos básicos.", startDate: "2026-03-31", endDate: "2026-04-13", weight: 25 },
      { id: "dbd-2", name: "Fase 2 - Diseño Conceptual", description: "Diagrama entidad relación.", startDate: "2026-04-14", endDate: "2026-05-11", weight: 100 },
      { id: "dbd-3", name: "Fase 3 - Diseño Lógico", description: "Modelo relacional y normalización.", startDate: "2026-05-12", endDate: "2026-06-08", weight: 100 },
      { id: "dbd-4", name: "Fase 4 - Componente práctico (Simuladas)", description: "Implementación SQL.", startDate: "2026-06-09", endDate: "2026-07-06", weight: 150 },
      { id: "dbd-5", name: "Fase 5 - Evaluación Final", description: "Consolidación base de datos.", startDate: "2026-07-07", endDate: "2026-07-20", weight: 125 }
    ]
  }
];
