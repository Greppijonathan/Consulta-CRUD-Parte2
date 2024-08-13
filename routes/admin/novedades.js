const express = require('express');
const router = express.Router();
const novedadesModel = require('../../models/novedadesModel');
const util = require('util');
const cloudinary = require('cloudinary').v2;
const uploader = util.promisify(cloudinary.uploader.upload);

// GET home page
router.get('/', async function (req, res, next) {
    try {
        var novedades = await novedadesModel.getNovedades();
        novedades = novedades.map(novedad => {
            if (novedad.img_id) {
                const imagen = cloudinary.image(novedad.img_id, {
                    width: 100,
                    height: 100,
                    crop: 'fill'
                });
                return {
                    ...novedad,
                    imagen
                };
            } else {
                return {
                    ...novedad,
                    imagen: ''
                };
            }
        });
        res.render('admin/novedades', {
            layout: 'admin/layout',
            usuario: req.session.nombre,
            novedades: novedades
        });
    } catch (error) {
        next(error);
    }
});

// GET agregar page
router.get('/agregar', (req, res, next) => {
    res.render('admin/agregar', {
        layout: 'admin/layout'
    });
});

// POST agregar
router.post('/agregar', async (req, res, next) => {
    try {
        let img_id = '';
        if (req.files && Object.keys(req.files).length > 0) {
            let imagen = req.files.imagen;
            img_id = (await uploader(imagen.tempFilePath)).public_id;
        }

        if (req.body.titulo && req.body.subtitulo && req.body.cuerpo) {
            await novedadesModel.insertNovedad({
                ...req.body,
                img_id: img_id
            });
            res.redirect('/admin/novedades');
        } else {
            res.status(400).send('Todos los campos son obligatorios');
        }
    } catch (error) {
        next(error);
    }
});

// GET eliminar
router.get('/eliminar/:id', async (req, res, next) => {
    try {
        var id = req.params.id;
        await novedadesModel.deleteNovedadesById(id);
        res.redirect('/admin/novedades');
    } catch (error) {
        next(error);
    }
});

// GET modificar
router.get('/modificar/:id', async (req, res, next) => {
    try {
        var id = req.params.id;
        var novedad = await novedadesModel.getNovedadesById(id);
        res.render('admin/modificar', { layout: 'admin/layout', novedad });
    } catch (error) {
        next(error);
    }
});

// POST modificar
router.post('/modificar', async (req, res, next) => {
    try {
        var obj = {
            titulo: req.body.titulo,
            subtitulo: req.body.subtitulo,
            cuerpo: req.body.cuerpo
        };
        await novedadesModel.modificarNovedadesById(obj, req.body.id);
        res.redirect('/admin/novedades');
    } catch (error) {
        console.log(error);
        res.render('admin/modificar', {
            layout: 'admin/layout',
            error: true,
            message: 'No se modificó la novedad'
        });
    }
});

module.exports = router;
