# Zenore Architecture

## Goal

Build a single-seller Turkish e-commerce website for Zenore leather products.

## Core Principles

- PostgreSQL is the source of truth for products, inventory, orders, payments, and reports.
- Firebase is used for authentication, file storage, and selected platform services.
- The backend owns all business logic.
- The frontend must never decide final prices, stock validity, payment status, or order status.
- Payment callbacks must be verified by the backend before an order is marked as paid.
- Card data must not be stored by this application.

## Applications

### Web

Customer storefront and admin interface.

### API

Backend service responsible for:

- authentication verification
- product APIs
- cart validation
- order creation
- stock management
- payment integration
- admin actions

## Database

Main database: PostgreSQL.

ORM: Prisma.

Money values must be stored as integer kurus, not floating point numbers.

Example:

```text
1499.90 TL -> 149990
```

## Payment

Provider to be selected:

- iyzico
- PayTR
