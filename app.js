const express = require('express');
const app = express();
const path = require('path');
const helmet = require('helmet');
const session = require('cookie-session');
require('dotenv').config();
const meli = require('mercadolibre');
const { validateToken } = require('./middlewares/tokens');
const { meli_get } = require('./utils');

const { CLIENT_ID, CLIENT_SECRET, SYS_PWD } = process.env;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(helmet());
app.use(session({
  name: 'session',
  keys: ['bd7126f457237e4aab0d47124ce4aac2', '9009def68579d15d871a5bf346422839'],
  cookie: {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 60 * 1000 * 6) // 6 horas
  },
}));
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/login', (req, res) => {
  if (req.body.password === SYS_PWD) {
    req.session.user = true;
    res.redirect('/home');
  } else {
    res.redirect('/?error=senha-incorreta');
  }
});

app.get('/home', validateToken, async (req, res) => {
  try {
    const meliObject = new meli.Meli(CLIENT_ID, CLIENT_SECRET, res.locals.access_token);
    const user = await meli_get(meliObject, '/users/me');
    const currencies = await meli_get(meliObject, '/currencies');
    const listing_types = await meli_get(meliObject, `/sites/${user.site_id}/listing_types`);
    res.render('home', {
      user,
      currencies,
      listing_types
    });
  } catch (err) {
    console.log('Something went wrong', err);
    res.status(500).send(`Error! ${err}`);
  }
});

module.exports = app;