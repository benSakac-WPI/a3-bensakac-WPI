const { application } = require("express");
const express = require("express")
const router = express.Router()
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

client.connect();
const birthdayDB = client.db("Birthdays");

router.get("/", (req, res) => {
    res.render("index.ejs");
})

router.get("/login", (req, res) => {
	if (req.session.login === true) {
		res.render("index.ejs")
	} else {
		res.render("login.ejs", {error: ""})
	}
})

router.get("/register", (req, res) => {
	res.render("index.ejs")
})

router.post("/logout", (req, res) => {
	req.session = null;
	res.redirect("/login")
})

router.get("//newBirthday", (req, res) => {
	res.render("updateORdelete.ejs")
})

router.post("/newBirthday", (req, res) => {
	let newBirthday = {
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		relationship: req.body.relationship,
		birthday: req.body.birthday,
		giftidea: req.body.giftidea,
		submitTime: Date.now(),
	};
	birthdayDB.collection(req.session.user).insertOne(newBirthday)
	res.render("updateORdelete.ejs")
})

router.get("/birthdays", async (req, res) => {
	let birthdays = await birthdayDB.collection(req.session.user).find({}).toArray();
	res.json (birthdays)
})

router.get("/removeBirthday", (req, res) => {
	res.render("updateORdelete.ejs")
})

router.post("/removeBirthday", async (req, res) => {
	let timeID = Number(req.body.submitTime)
	birthdayDB.collection(req.session.user).deleteOne({submitTime: timeID})
	res.render("updateORdelete.ejs")
})

router.post("/editBirthday", async (req, res) => {
	let body = req.body;
	let timeID = Number(body.submitTime)
	filter = {submitTime: timeID}
	let birthToEdit = await birthdayDB.collection(req.session.user).findOne(filter)
	res.json(birthToEdit)
})

router.get("/updateBirthday", (req, res) => {
	res.render("updateORdelete.ejs")
})

router.post("/updateBirthday", async (req, res) => {
	let updateBirthday = {
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		relationship: req.body.relationship,
		birthday: req.body.birthday,
		giftidea: req.body.giftidea,
		submitTime: Number(req.body.submitTime)
	}
	let filter = {submitTime: updateBirthday.submitTime}
	let birthToEdit = await birthdayDB.collection(req.session.user).findOne(filter)
	delete birthToEdit._id
	let diff = compareBirthdays(birthToEdit, updateBirthday)
	let update = {
		$set: diff
	}
	await birthdayDB.collection(req.session.user).updateOne(filter, update);
	res.render("updateORdelete.ejs")
})

function compareBirthdays (dbBirthday, newUpdate) {
	if (Object.keys(dbBirthday).length == 0
	&& Object.keys(newUpdate).length > 0)
	return newUpdate;

	let diff ={};
	for (const key in dbBirthday) {
		if (newUpdate[key] && dbBirthday[key] != newUpdate[key]){
			diff[key] = newUpdate[key];
		}
	}
	if (Object.keys(diff).length > 0) 
		return diff;

	return dbBirthday
}

module.exports = router