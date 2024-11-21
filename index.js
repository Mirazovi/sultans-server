const express = require('express')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000;


app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.aqgz8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const menuCollection = client.db("sultanDB").collection("menu");
    const reviewsCollection = client.db("sultanDB").collection("reviews");
    const cartsCollection = client.db("sultanDB").collection("carts");
    const usersCollection = client.db("sultanDB").collection("users");

    app.get('/menu',async(req,res)=>{
        const result = await menuCollection.find().toArray();
        res.send(result);
    })
    app.get('/reviews',async(req,res)=>{
        const result = await reviewsCollection.find().toArray();
        res.send(result);
    })
    // app.get('/menuCount',async(req,res)=>{
    //     const count = await menuCollection.estimatedDocumentCount();
    //     res.send({count})
    // })

    // cart related API 

    app.get('/carts',async(req,res)=>{
      const email = req.query.email;
      const query = {email : email}
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    })

    app.post('/carts',async(req,res)=>{
      const cartBody = req.body;
      const result = await cartsCollection.insertOne(cartBody);
      res.send(result);
    })

    app.delete('/carts/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await cartsCollection.deleteOne(query)
      res.send(result)
    })

    // verified token middleWare 
    const verifiedToken = (req,res,next)=>{
      console.log('inside verified token',req.headers.Authorization);
      if(!req.headers.Authorization){
        return res.status(401).send({message: 'forbidden access'})
      }
      const token = req.headers.Authorization.split(' ')[1];
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
          return res.status(401).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
      })
    }

    // user related API 

    app.get('/users',async(req,res)=>{
      // console.log(res.headers);
      const result = await usersCollection.find().toArray();
      res.send(result);
    })

    app.post('/users',async(req,res)=>{
      const user = req.body;
      const query = {email : user.email}
      const existing = await usersCollection.findOne(query)
      if(existing){
        return res.send({massage : 'user already exists'})
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })

    app.delete('/users/:id',async(req,res)=>{
      const id = req.params.id;
      const query= {_id: new ObjectId(id)}
      const result = await usersCollection.deleteOne(query)
      res.send(result);
    })


    app.patch('/users/admin/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set:{
          role:'admin'
        }
      }
      const result = await usersCollection.updateOne(filter,updatedDoc)
      res.send(result);
    })

              // jwt related api 
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1hr'})
      res.send({token});
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('SERVER IS RUNNING');
})

app.listen(port, () => {
  console.log(`SERVER IS RUNNING ON PORT : ${port}`)
})