// redis code
// // queue/dispatchOrderCustomer.js
// const Queue = require("bull");

// const createOrderJob = require("../jobs/createOrderJob");
// const queue = new Queue("order-customer");
// queue.process(async (job) => {
//   await createOrderJob(job.data);
// });

// function dispatchOrderJob(order, cD) {
//   queue.add({
//     orderId: order.id,
//     customerData: cD,
//   });
// }
