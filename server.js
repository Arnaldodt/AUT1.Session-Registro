const express = require("express");
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const {body , validationResult} = require('express-validator');
mongoose.connect('mongodb://localhost/Usuario', {useNewUrlParser: true});

const esquemaUsr = new mongoose.Schema({
    nombre: {type:String,required:[true,'campo requerido']},
    apellido: {type:String,required:[true,'campo requerido']},
    correo: {type:String,required:[true,'campo requerido'],unique:true},
    pwd: {type:String,required:[true,'campo requerido']},
    cumpleaños: {type:Date,required:[true,'campo requerido']}
    },{timestamps:true})

const Usuario = mongoose.model('db_Usr', esquemaUsr);

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.set('view engine','ejs');
app.set('views',__dirname + '/views');
app.use( express.static(__dirname + "/static"));
app.use("/recursos", express.static(__dirname + "/public"));

app.get('/', (req, res) => {
    res.render("index",{validaciones:[], Datos:req.body})
})
app.get('/CrearUsuario', async (req, res) => {
    res.render("CrearUsuario",{validaciones:[], Datos:req.body})
});

app.post('/CrearUsuario', [
    body('nombre','Ingrese Nombre')
        .exists()
        .isLength({min:5}),
    body('apellido','Ingrese apellido')
        .exists()
        .isLength({min:5}),
    body('correo','Ingrese correo')
        .exists()
        .isLength({min:5})
        .isEmail(),
    body('pwd','Ingrese Password')
        .exists()
        .isLength({min:5}),
    body('cumpleaños','Ingrese Cumpleaños')
        .exists()
        .isDate(),
], async (req, res) => {
    
    const errores = validationResult(req)
    if (!errores.isEmpty())
    {
        let arrErr = errores.array();
        console.log(arrErr);
        res.render("CrearUsuario",{validaciones:arrErr, Datos:req.body})
    }
    else {
        const {nombre, apellido, correo, pwd, cumpleaños} = {...req.body};

        const usr = new Usuario
        usr.nombre = nombre;
        usr.apellido = apellido;
        usr.correo = correo;
        usr.pwd = await encriptar(pwd);
        usr.cumpleaños = cumpleaños;

        usr.save()
        .then(newUserData => {
            res.redirect("/")
        })
        .catch(err => {
            console.log(err);
            res.send(err + "<br><a href='CrearUsuario.html'>Volver!</a>")
        });
        
    }
})

app.post('/ValidarUsuario',[
    body('correo','Ingrese Correo')
        .exists()
        .isLength({min:5})
        .isEmail(),
    body('pwd','Ingrese Password')
        .exists()
        .isLength({min:5})
    ],  (req,res) =>{
    
    const errores = validationResult(req)
    if (!errores.isEmpty())
    {
        let arrErr = errores.array();
        console.log(arrErr);
        res.render("index",{validaciones:arrErr, Datos:req.body})
    }
    else {
        Usuario.findOne({correo:req.body.correo})
        .then(async data => {
            if (data !== null){
                const validPassword = await validar(req.body.pwd, data.pwd)
                if (validPassword){
                    res.send("USUARIO LOGUEADO<br><a href='/'>Volver!</a>");
                }else{
                    res.send("PASSWORD INCORRECTA<br><a href='/'>Volver!</a>");
                }
            } else {
                res.send("USUARIO NO ENCONTRADO<br><a href='/'>Volver!</a>");
            }
        })
        .catch(err => {
            res.send(err + "<br><a href='/'>Volver!</a>")
        });
    }
})

async function encriptar (info){
    return  await bcrypt.hash(info, 10)
}

async function validar (info, claveEncrip){
    return await bcrypt.compare(info, claveEncrip)
}

app.listen(8000, ()=>{
    console.log("Servidor escuchando el puerto 8000");
});