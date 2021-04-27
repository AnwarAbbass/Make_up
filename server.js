require('dotenv').config();

const express = require('express');
const pg = require('pg');
const cors = require('cors');
const superagent = require('superagent');
const methodOverride = require('method-override');
const { select } = require('async');

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

const client = new pg.Client( { connectionString: process.env.DATABASE_URL, ssl: process.env.LOCALLY ? false : {rejectUnauthorized: false}} );

app.get('/',homeHandler);
app.post('/ProductByPrice',productByPrice);
app.post('/MyProducts',myProducts);
app.get('/allproduct',allProduct);
app.get('/mycard',mycard);
app.post('/viewcard/:id',viewcard);
app.put('/viewcard/:id',update);
app.delete('/viewcard/:id',deleteHandler);

function homeHandler(req,res){
    res.render('home');
}

function productByPrice(req,res){
    let url = `http://makeup-api.herokuapp.com/api/v1/products.json?brand=${req.body.brand}&price_greater_than=${req.body.miniPrice}&price_less_than=${req.body.maxPrice}`;
    superagent.get(url)
    .then(data =>{
        let brands = data.body.map(val => new Product(val));
        res.render('ProductByPrice',{brand:brands});
    })
    .catch(err => res.send(err));
}

function myProducts(req,res){
    let {image,name,price,description}=req.body;
    let SQL = 'insert into product(image,name,price,description) values ($1,$2,$3,$4); ';
    let safeValues = [image,name,price,description];
    client.query(SQL,safeValues)
    .then(data => res.render('MyProducts',{brand:data.rows}))
    .catch(err => res.send(err));
}

function allProduct(req,res){
    let url=`http://makeup-api.herokuapp.com/api/v1/products.json?brand=maybelline`;
    superagent.get(url)
    .then(data =>{
        let brands = data.body.map(val => new Product(val));
        res.render('allProduct',{brand:brands});
    })
    .catch(err => res.send(err));
}

function viewcard(req,res){
    let SQL= 'select * from product where id =$1;';
    let safevalue=[req.params.id];
    client.query(SQL,safeValues)
    .then(data => res.render('detail',{val:data.rows[0]}))
    .catch(err => res.send(err));
}

function update(req,res){
    let {image,name,price,description}=req.body;
    let SQL = 'update product set image=$1,name=$2,price=$3,description=$4 where id=$5 returning id;';
    let safeValues =[image,name,price,description,req.params.id];
    client.query(SQL,safeValues)
    .then(data => res.redirect(`/viewcard${data.rows.id}`))
    .catch(err => res.send(err));
}

function deleteHandler(req,res){
    let {image,name,price,description}=req.body;
    let SQL = 'delete from product where id=$5;';
    let safeValue =[req.params.id];
    client.query(SQL,safeValue)
    .then(data => res.redirect(`/viewcard${data.rows.id}`))
    .catch(err => res.send(err));
}

function mycard(){
    let SQL = 'select * from product;';
    client.query(SQL)
    .then(data =>
         res.render('mycard',{brand:data.rows}))
    .catch(err=>res.send(err));
}

function Product(data){
    this.name=data.name;
    this.price=data.price;
    this.image=data.image;
    this.description=data.description;
}

client.connect().then(()=>{
    app.listen(PORT,()=>console.log(`listen to port ${PORT}`));
})