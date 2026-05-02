---
name: Rhythm Control — Design System Constraint
description: No crear CSS nuevo en Rhythm Control. Usar exclusivamente variables y clases existentes del proyecto.
type: feedback
---

No añadir CSS nuevo ni librerías UI. Usar solo lo existente: `styles/variables.css`, clases Tailwind 4.2.2, y patrones de componentes ya en el código.

**Why:** El usuario quiere mantener el aspecto visual actual de la app sin ninguna modificación de estilos.

**How to apply:** Antes de escribir cualquier componente nuevo de Rhythm Control, leer `/admin/ajustes/page.tsx` como referencia de patrón de UI. Copiar exactamente los inline styles y clases existentes. No crear nuevas clases CSS.
