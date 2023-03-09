const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const day = date.getDate();
const PORT = process.env.PORT || 3000;
mongoose.set('strictQuery', false);

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

app.set("view engine", "ejs");

mongoose.connect(process.env.DATABASE_URL);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to Mayank's Todolist!"
});

const item2 = new Item({
  name: "Use the + button to add a new task."
});

const item3 = new Item({
  name: "<-- Hit this to delete a task."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItem) {

    if (foundItem.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Default items inserted successfully.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        kindOfDay: day,
        newItem: foundItem,
      });
    }
  });
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/:customListName", function(req, res) {
  const newName = _.capitalize(req.params.customListName);

  List.findOne({
    name: newName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: newName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + newName);
      } else {
        res.render("list", {
          kindOfDay: foundList.name,
          newItem: foundList.items
        });
      }
    }
  });
});

app.post("/", function(req, res) {
  const itemName = req.body.nextItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if(listName === day){
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
   });
  }

});

app.post("/custom", function(req, res){
  const customListName = req.body.customList;
  res.redirect("/" + customListName);
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.listen(PORT, function() {
  console.log("Server is running on port 3000.");
});
