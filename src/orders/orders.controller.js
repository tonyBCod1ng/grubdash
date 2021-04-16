const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function list(req, res, next) {
  res.json({ data: orders });
}

function create(req, res, next) {
  const { deliverTo, mobileNumber, dishes } = req.body.data;
  const id = nextId();
  const newOrder = { id, deliverTo, mobileNumber, dishes };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  const { order } = res.locals;
  res.json({ data: order });
}

function update(req, res, next) {
  const { deliverTo, mobileNumber, dishes } = req.body.data;
  const { order } = res.locals;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.dishes = dishes;
  orders[res.locals.orderIndex] = order;
  res.json({ data: order });
}

function destroy(req, res, next) {
  //   orders = orders.filter((order) => order.id !== res.locals.order.id);
  const indexToDestroy = orders.findIndex(
    (order) => order.id === res.locals.order.id
  );
  orders.splice(indexToDestroy, 1);
  res.sendStatus(204);
}

/* MIDDLEWARE */

function orderExists(req, res, next) {
  const foundOrderIndex = orders.findIndex(
    (order) => order.id === req.params.orderId
  );
  if (foundOrderIndex < 0) {
    return next({
      status: 404,
      message: `Order ${req.params.orderId} does not exist`,
    });
  }
  res.locals.orderIndex = foundOrderIndex;
  res.locals.order = orders[foundOrderIndex];
  return next();
}

function validUpdate(req, res, next) {
  const reqOrder = req.body.data;
  if (!reqOrder.status || reqOrder.status === "invalid") {
    return next({
      status: 400,
      message: "A pending status is required to update an order.",
    });
  }
  next();
}

function validDelete(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

function idMatch(req, res, next) {
  if (!req.body.data.id) return next();
  if (req.body.data.id !== req.params.orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${req.body.data.id}, Route: ${req.params.orderId}`,
    });
  }
  return next();
}

function validOrder(req, res, next) {
  const { data } = req.body;

  if (!data) {
    return next({
      status: 400,
      message: "Please include a request body with the order's attributes.",
    });
  }

  const { deliverTo, mobileNumber, dishes } = data;

  if (!deliverTo || deliverTo.trim().length === 0) {
    return next({ status: 400, message: "Order must include a deliverTo" });
  }

  if (!mobileNumber || mobileNumber.trim().length === 0) {
    return next({ status: 400, message: "Order must include a mobileNumber" });
  }

  if (!dishes) {
    return next({ status: 400, message: "Order must include a dish" });
  }

  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }

  dishes.forEach((dish, index) => {
    const { quantity } = dish;
    if (
      !quantity ||
      typeof quantity !== "number" ||
      quantity - Math.floor(quantity) !== 0 ||
      quantity < 1
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

module.exports = {
  list,
  create: [validOrder, create],
  read: [orderExists, read],
  update: [orderExists, validOrder, validUpdate, idMatch, update],
  destroy: [orderExists, validDelete, destroy],
};
