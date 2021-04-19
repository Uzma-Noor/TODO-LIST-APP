const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const mongoose = require('mongoose');//mongodb://localhost:27017/todolistDB
mongoose.connect('mongodb+srv://admin-uzma:uzma10@cluster0.oqnhu.mongodb.net/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true});

const _ = require('lodash');
const https = require('https');
const date = require(__dirname + '/date.js');


app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));
var day = "";
var workItems = [];

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = new mongoose.model('Item', itemsSchema);

const defaultItems = [
  {name: "Drink water"},
  {name: "Eat eggs"},
  {name: "Workout"}
];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
    day = date.getDay();
    Item.find({}, function(err, items){
      if(err)
        console.log(err);
      else if(items.length === 0){
        Item.insertMany(defaultItems, function(err){
          if(err){
            console.log(err);
          }else{
            console.log("successfully added default items");
          }
        });
        res.redirect("/");
      }else{
        List.find({}, function(err, allLists){
          res.render('list', {listTitle:"Today", newTodos :items, allLists: allLists});
        })
      }
    });
});

app.post("/", function(req, res){
  console.log(req.body); //{ newItem: 'Colony Item2', button: 'Colony' }
  const listName = req.body.button;
  const itemName = req.body.newItem;
  const item = new Item({
    name: itemName
  })
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName}, function(err, foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
    });
  }
});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName}, function(err, foundlist){
    if(err)
      console.log(err);
    if(!foundlist){
      console.log("doesn't exist");
      if(customListName !== "Favicon.ico"){
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      //res.render("list", {listTitle:customListName, newTodos : defaultItems});
      res.redirect("/" + customListName);
      }
    }else{
      console.log("exist");
      res.render("list", {listTitle:customListName, newTodos : foundlist.items});
    }
  })
});

app.post("/delete", function(req, res){
  console.log("In delete route");
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName == "Today"){
    Item.deleteOne({_id: checkedItemId}, function(err){
      if(err)
        console.log(err);
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:checkedItemId}}}, function(err, foundlist){
      if(!err)
        res.redirect("/" + listName);
    });
  }
});

app.post("/redirect", function(req, res){
  res.redirect('/'+req.body.url);
});

app.get("/about", function(req, res){
  res.render('about');
});

app.listen(process.env.PORT || 3000, function(req, res){
    console.log("listening..");
});
