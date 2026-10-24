# Fieldwise Farm Operations frontend

## Development

```sh
npm install
npm run dev
```

## Checks

```sh
npm run build
npm run lint
```

The current frontend uses illustrative demo records and local page state. It is not connected to a farm API, weather provider, authentication service, database, or live sensor feed. Changes made in a page are not persisted after a reload.

The GIS mapping feature is deferred pending separate approval of a mapping library and tile-source constraints. The navigation marks it as pending rather than presenting a nonfunctional map as complete.
