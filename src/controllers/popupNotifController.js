const { Op } = require("sequelize");
const Order = require("../models/order");
const OrderItems = require("../models/orderItems");
const dayjs = require("dayjs");
const RoleUser = require("../models/roleUser");

exports.list = async (req, res, next) => {
  try {
    const owner = req.user.userId;;
    let owner_list = [];

    if (owner == '325') {
        // 14, 42, 33, 91
        // 'Account Executive', 'Admin Tele', 'Tele Leader New', 'Operational Tele Supervisor'
        const roleUser = await RoleUser.findAll({
            where : {
                role_id: { [Op.in]: [14, 42, 33,91] }
            },
            attributes: ['user_id'],
            raw: true
        })
        const userIds = roleUser.map(r => r.user_id);
        owner_list = userIds;
    } else {
        owner_list = [owner];
    }

    const orders = await Order.findAll({
      where: {
        payment_status: "unpaid",
        owner: { [Op.in]: owner_list },
        payment_type: "cash",
        payment_method: "bank-transfer",
        status: "unapproved",
        created_at: { [Op.gte]: dayjs().startOf("day").toDate() },
      },
      include: [
        {
          model: OrderItems,
          as: "orderItemsData",
          attributes: ["id", "order_id", "date_time"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const unpaidOrders = orders.filter(
      (order) => !order.payments || order.payments.length === 0
    );

    const results = [];
    const scheduleAll = [];

    for (const order of unpaidOrders) {
      const item = order.orderItemsData && order.orderItemsData[0];
      if (!item) continue;

      const deliveryTime = dayjs(item.date_time);
      const createdTime = dayjs(order.created_at);
      const notToday = !deliveryTime.isSame(dayjs(), "day");

      // generate schedule
      let pointer = createdTime.clone();
      const fourHoursBeforeDelivery = deliveryTime.clone().subtract(4, "hour");
      const schedules = [];

      while (pointer.isBefore(deliveryTime)) {
        if (pointer.isAfter(dayjs())) {
          const pointerType = pointer.isBefore(fourHoursBeforeDelivery)
            ? "4 hour"
            : "15 minute";
          const scheduleItem = {
            order_id: order.id,
            order_number: order.order_number,
            order_created_at: createdTime.format("YYYY-MM-DD HH:mm:ss"),
            cart_id: item.id,
            date_time: item.date_time,
            time: pointer.format("YYYY-MM-DD HH:mm:ss"),
            not_today: notToday,
            pointer_type: pointerType,
          };
          schedules.push(scheduleItem);
          scheduleAll.push(scheduleItem);
        }

        if (pointer.isBefore(fourHoursBeforeDelivery)) {
          pointer = pointer.add(4, "hour");
        } else {
          pointer = pointer.add(15, "minute");
        }
        // pointer = pointer.add(1, "minute");
      }

      if (schedules.length) {
        results.push({
          order_id: order.id,
          cart_item: item,
          not_today: notToday,
          owner: order.owner,
          schedules,
        });
      }
    }

    // sort
    scheduleAll.sort((a, b) => new Date(a.time) - new Date(b.time));

    return res.json({
      owner: owner_list,
      result: results,
      schedule: scheduleAll,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};
