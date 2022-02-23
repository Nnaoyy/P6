const Sauce = require('../models/Sauce');
const fs = require('fs');


exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce enregistrée !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
      .then(sauces => res.status(200).json(sauces))
      .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res ,next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error}));

};

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            //si l'utilisateur connecté n'est pas celui qui a créé la recette
            if (sauce.userId !== req.auth.userId){
                res.status(401).json({ error : new error('Requête non autorisée !')});
            }
            else {
                //si c'est le bon utilisateur on supprime l'image du dossier images et on supprime la recette
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id})
                    .then(() => res.status(200).json({ message: 'Sauce supprimée'}))
                    .catch(error => res.status(400).json({ error}));
                });
            }
        })
        .catch(error => res.status(500).json({ error}));
};

exports.modifySauce = (req, res, next) => {
    //on vérifie si il y a un changement d'image ou non
    const sauceObject = req.file ?
    {
        //si il y a changement d'image on récupère la nouvelle URL
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } 
    // sinon on récupère les autres changements
    : { ...req.body };
    
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            //si il y a eu changement d'images on supprime du fichier images l'ancienne image puis on sauvegarde les changements
            if (sauceObject.imageUrl !== undefined ) {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'sauce modifiée !'}))
                .catch(error => res.status(400).json({ error }));
            });}
            //sinon on sauvegare les changements
            else{
                Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'sauce modifiée !'}))
                .catch(error => res.status(400).json({ error }));
            }
        })
        .catch(error => res.status(500).json({ error}));
};


exports.likeSauce = (req, res, next) => {
    // récupère le champs likes
    const likeStatus = req.body.like;
    // récupère l'id de l'URL
    const sauceId = req.params.id;
    // récupère le userId
    const userId = req.body.userId;
    switch(likeStatus) {
        // ajout d'un like
        case 1:
            Sauce.updateOne({ _id: sauceId}, { 
                $inc: { likes: +1 }, 
                $push: { usersLiked: req.body.userId }
            })
            .then(() => res.status(201).json({ message: 'Ajout du like !'}))
            .catch(error => res.status(400).json({ error }));
            break;
        //ajout d'un dislike    
        case -1:
            Sauce.updateOne({ _id: sauceId}, {
                $inc: { dislikes: +1 },
                $push: { usersDisliked: req.body.userId }
            })
            .then(() => res.status(201).json({ message: "Ajout d'un dislike ! "}))
            .catch(error => res.status(400).json({ error }));
            break;
        // suppression like et dislike    
        case 0:
            Sauce.findOne({ _id: sauceId })
            .then(sauce => {
                //Supprimer son like de UsersLiked
                if(sauce.usersLiked.includes(userId)){
                    Sauce.updateOne({ _id: sauceId},
                        {
                            $inc: { likes: -1 },
                            $pull: { usersLiked: userId}
                        })
                    .then(() => res.status(201).json({ message: "Suppression du like !"}))
                    .catch((error) => res.status(400).json({ error }));
                } 
                else if(sauce.usersDisliked.includes(userId)) {
                    // Supprimer son dislike de usersDisliked
                    Sauce.updateOne({_id: sauceId},
                        {
                            $inc: { dislikes: -1},
                            $pull: { usersDisliked: userId}
                        })
                    .then(() => res.status(201).json({ message: "Suppression du dislike ! "}))
                    .catch((error) => res.status(400).json({ error }));
                } 
                else {
                    res.status(403).json({ message: "requête impossible !"})
                }
            })
            .catch(() => res.status(404).json({ message: "Sauce introuvable !"}));
            break;
    }
};