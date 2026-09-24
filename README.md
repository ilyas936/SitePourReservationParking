# RES'PARKING

Réservation de places dans un parking privé : plan 3D, choix de la place, prix au survol, saisie de la plaque d'immatriculation.

## Structure

```
res-parking/
├─ index.html              Accueil
├─ reserver.html           Plan 3D + réservation (plaque)
├─ mes-reservations.html   Retrouver / annuler ses réservations par plaque
├─ css/
│  └─ style.css            Styles communs
├─ js/
│  ├─ common.js            Places, tarifs, plaque (AB-123-CD), stockage, réservation
│  ├─ scene3d.js           Scène Three.js (caméra, survol, voitures)
│  ├─ reserver.js          Page de réservation (état, panneau, contrôles)
│  └─ mes-reservations.js  Page « Mes réservations »
└─ README.md
```

Ordre de chargement sur `reserver.html` : Three.js (CDN), `common.js`, `scene3d.js`, `reserver.js`.

## Lancer

Ouvrir `index.html` dans le navigateur, ou `npx serve .` dans le dossier.

## Notes

- Les réservations sont gardées dans le `localStorage` du navigateur (pas de serveur pour l'instant).
- L'occupation des places est en partie simulée (`busy()` dans `js/common.js`).
- Étape suivante : un backend (API + base de données) pour partager les réservations entre utilisateurs.
