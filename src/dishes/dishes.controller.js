const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

function list(req, res, next) {
  res.json({ data: dishes });
}

function create(req, res, next) {
  const { name, description, price, image_url } = req.body.data;
  const id = nextId();
  const newDish = { id, name, description, image_url, price };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  const { dish } = res.locals;
  res.json({ data: dish });
}

function update(req, res, next) {
  const { name, description, price, image_url } = req.body.data;
  const { dish } = res.locals;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  dishes[res.locals.dishIndex] = dish;
  res.json({ data: dish });
}

/* MIDDLEWARE */

function dishExists(req, res, next) {
  const foundDishIndex = dishes.findIndex(
    (dish) => dish.id === req.params.dishId
  );
  if (foundDishIndex < 0) {
    return next({
      status: 404,
      message: `Dish ${req.params.dishId} does not exist`,
    });
  }
  res.locals.dishIndex = foundDishIndex;
  res.locals.dish = dishes[foundDishIndex];
  return next();
}

function validDish(req, res, next) {
  const { data } = req.body;

  if (!data) {
    return next({
      status: 400,
      message: "Please include a request body with the dish's attributes.",
    });
  }

  if (!data.name || data.name.trim().length === 0) {
    return next({ status: 400, message: "Dish must include a name" });
  }

  if (!data.description || data.description.trim().length === 0) {
    return next({ status: 400, message: "Dish must include a description" });
  }

  if (!data.price) {
    return next({ status: 400, message: "Dish must include a price" });
  }

  if (
    typeof data.price !== "number" ||
    data.price - Math.floor(data.price) !== 0 ||
    data.price <= 0
  ) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }

  if (!data.image_url || data.image_url.trim().length === 0) {
    return next({ status: 400, message: "Dish must include a image_url" });
  }

  return next();
}

function idMatch(req, res, next) {
  if (!req.body.data.id) return next();
  if (req.body.data.id !== req.params.dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${req.params.dishId}`,
    });
  }
  return next();
}

module.exports = {
  list,
  create: [validDish, create],
  read: [dishExists, read],
  update: [dishExists, validDish, idMatch, update],
};
