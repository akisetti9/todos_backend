const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

// Importing module
const { parse, format, isMatch } = require("date-fns");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//Convert TODO Format
const convertToDoObj = (dbObj) => {
  return {
    id: dbObj.id,
    todo: dbObj.todo,
    priority: dbObj.priority,
    status: dbObj.status,
    category: dbObj.category,
    dueDate: dbObj.due_date,
  };
};

let queryBox = {
  status: "",
  priority: "",
  category: "",
  dueDate: "-",
};

//Invalid Status
const checkStatus = (request, response, next) => {
  const { status } = request.query;
  if (status === "TO DO") {
    queryBox.status = status;
    next();
  } else if (status === "IN PROGRESS") {
    queryBox.status = status;
    next();
  } else if (status === "DONE") {
    queryBox.status = status;
    next();
  } else if (status === undefined) {
    queryBox.status = "";
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
};

//Invalid Priority
const checkPriority = (request, response, next) => {
  const { priority } = request.query;
  if (priority === "HIGH") {
    queryBox.priority = "HIGH";
    next();
  } else if (priority === "MEDIUM") {
    queryBox.priority = "MEDIUM";
    next();
  } else if (priority === "LOW") {
    queryBox.priority = "LOW";
    next();
  } else if (priority === undefined) {
    queryBox.priority = "";
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
};

//Invalid Category
const checkCategory = (request, response, next) => {
  const { category } = request.query;
  if (category === "WORK") {
    queryBox.category = "WORK";
    next();
  } else if (category === "HOME") {
    queryBox.category = "HOME";
    next();
  } else if (category === "LEARNING") {
    queryBox.category = "LEARNING";
    next();
  } else if (category === undefined) {
    queryBox.category = "";
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }
};

//Invalid Due Date
const checkDueDate = async (request, response, next) => {
  const { date } = request.query;
  try {
    const parsedDate = parse(date, "yyyy-MM-dd", new Date());
    const result = format(parsedDate, "yyyy-MM-dd");
    queryBox.dueDate = result;
    next();
  } catch (error) {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

// Get Todos API-1
app.get(
  "/todos/",
  checkStatus,
  checkPriority,
  checkCategory,
  async (request, response) => {
    const { search_q = "" } = request.query;
    const { status, priority, category } = queryBox;
    const getTodosQuery = `SELECT
      *
    FROM
      todo
    WHERE
     todo LIKE '%${search_q}%' AND status LIKE '%${status}%' AND priority LIKE '%${priority}%' AND category LIKE '%${category}%';`;
    const todoArray = await db.all(getTodosQuery);
    response.send(todoArray.map((todo) => convertToDoObj(todo)));
  }
);

//Get Todo API-2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertToDoObj(todo));
});

// Get Agenda API-3
app.get("/agenda/", checkDueDate, async (request, response) => {
  const { search_q = "" } = request.query;
  const { dueDate } = queryBox;
  const getTodosQuery = `SELECT
      *
    FROM
      todo
    WHERE
     due_date LIKE '%${dueDate}%'`;
  const todoArray = await db.all(getTodosQuery);
  response.send(todoArray.map((todo) => convertToDoObj(todo)));
});

let updateBox = {
  status: "",
  priority: "",
  category: "",
  dueDate: "",
};

//Invalid Status
const checkStatusUpdate = (request, response, next) => {
  const { status } = request.body;
  if (status === "TO DO") {
    updateBox.status = "TO DO";
    next();
  } else if (status === "IN PROGRESS") {
    updateBox.status = "IN PROGRESS";
    next();
  } else if (status === "DONE") {
    updateBox.status = "DONE";
    next();
  } else if (status === undefined) {
    updateBox.status = "";
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
};

//Invalid Priority
const checkPriorityUpdate = (request, response, next) => {
  const { priority } = request.body;
  if (priority === "HIGH") {
    updateBox.priority = "HIGH";
    next();
  } else if (priority === "MEDIUM") {
    updateBox.priority = "MEDIUM";
    next();
  } else if (priority === "LOW") {
    updateBox.priority = "LOW";
    next();
  } else if (priority === undefined) {
    updateBox.priority = "";
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
};

//Invalid Category
const checkCategoryUpdate = (request, response, next) => {
  const { category } = request.body;
  if (category === "WORK") {
    updateBox.category = "WORK";
    next();
  } else if (category === "HOME") {
    updateBox.category = "HOME";
    next();
  } else if (category === "LEARNING") {
    updateBox.category = "LEARNING";
    next();
  } else if (category === undefined) {
    updateBox.category = "";
    next();
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }
};

//Invalid Due Date
const checkDueDateUpdate = async (request, response, next) => {
  const { dueDate } = request.body;
  if (dueDate === undefined) {
    next();
  } else if (dueDate !== undefined) {
    if (isMatch(dueDate, "yyyy-MM-dd")) {
      next();
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
};

//Post Todo API-4
app.post(
  "/todos/",
  checkStatusUpdate,
  checkPriorityUpdate,
  checkCategoryUpdate,
  checkDueDateUpdate,
  async (request, response) => {
    const { id, todo } = request.body;
    const { status, priority, category, dueDate } = updateBox;
    console.log(dueDate);
    const createTodoQuery = `INSERT INTO
      todo (id,todo,priority,status,category,due_date)
    VALUES
      (
        ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}'
      );`;
    await db.run(createTodoQuery);
    response.send("Todo Successfully Added");
  }
);

//Update Todo Status API-5
app.put(
  "/todos/:todoId/",
  checkStatusUpdate,
  checkPriorityUpdate,
  checkCategoryUpdate,
  checkDueDateUpdate,
  async (request, response) => {
    const { todoId } = request.params;
    const { todo, dueDate } = request.body;
    const { status, priority, category } = updateBox;
    let updateTodoQuery = "";
    let output = "";
    if (status != "") {
      updateTodoQuery = `UPDATE
      todo
    SET
      status = '${status}'
    WHERE
      id = ${todoId};`;
      //      console.log(updateTodoQuery);
      output = "Status Updated";
    } else if (priority != "") {
      updateTodoQuery = `UPDATE
      todo
    SET
      priority='${priority}'
    WHERE
      id = ${todoId};`;
      output = "Priority Updated";
    } else if (category != "") {
      updateTodoQuery = `UPDATE
     todo
   SET
     category='${category}'
   WHERE
     id = ${todoId};`;
      output = "Category Updated";
    } else if (dueDate != undefined) {
      updateTodoQuery = `UPDATE
     todo
    SET
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;
      output = "Due Date Updated";
    } else {
      updateTodoQuery = `UPDATE
      todo
    SET
      todo='${todo}'
    WHERE
      id = ${todoId};`;
      output = "Todo Updated";
    }
    await db.run(updateTodoQuery);
    response.send(output);
  }
);

//Delete Book API-6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
