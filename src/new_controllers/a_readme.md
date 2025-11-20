# all controllers must using individual or single export function, not an class

# save and update must using helper function saveEntity like :

```js
await saveEntity(queryRunner.manager, Order, orderData);
```

# or

```js
const ShippingCostEstimationRepository = dataSource.getRepository(
  ShippingCostEstimation
);

await saveEntity(
  ShippingCostEstimationRepository,
  ShippingCostEstimation,
  payload
);
```

# and use this if you want to update existing entity with custom where clause (not by id)

```js
const customer = await saveEntityBy(
  queryRunner.manager,
  Customer,
  "email", // unique field
  {
    email: "wisnu@example.com",
    no_finance: "FIN-001",
    no_finance_2: null,
  }
);
```

# except for loop based query like :

```js
const orderItemsRepo = queryRunner.manager.getRepository(OrderItems);
const entities = items.map((item) =>
  orderItemsRepo.create({ ...item, order_id: order.id })
);
const createdItems = await orderItemsRepo.save(entities);
```
