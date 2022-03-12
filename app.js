const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require("dotenv").config();
const saucesRoutes = require ('./routes/sauces');
const userRoutes = require ('./routes/user')

mongoose.connect('mongodb+srv://' + process.env.DB_USERNAME + ':' + process.env.DB_PW + '@cluster0.h2qnd.mongodb.net/test?retryWrites=true&w=majority'
  )
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();

/*Permet l'accés à l'api depuis n'import quelle origine*/
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/sauces', saucesRoutes);
app.use('/api/auth', userRoutes);

module.exports = app;