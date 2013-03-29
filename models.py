# -*- coding: utf-8 -*-
from flask.ext.mongoengine.wtf import model_form
from wtforms.fields import * # for our custom signup form
from flask.ext.mongoengine.wtf.orm import validators
from flask.ext.mongoengine import *
from datetime import datetime

class User(mongoengine.Document):
	username = mongoengine.StringField(unique=True, max_length=30, required=True, verbose_name="Pick a Username")
	password = mongoengine.StringField(default=True,required=True)
	active = mongoengine.BooleanField(default=True)
	timestamp = mongoengine.DateTimeField(default=datetime.now())

user_form = model_form(User, exclude=['password'])

# Signup Form created from user_form
class SignupForm(user_form):
	password = PasswordField('Password', validators=[validators.Required(), validators.EqualTo('confirm', message='Passwords must match')])
	confirm = PasswordField('Repeat Password')

# Login form will provide a Password field (WTForm form field)
class LoginForm(user_form):
	password = PasswordField('Password',validators=[validators.Required()])

#################  end of user models/forms ##########################

class Image(mongoengine.EmbeddedDocument):
	filename = mongoengine.StringField()
	caption = mongoengine.StringField()
	
class Medium(mongoengine.Document):
	type = mongoengine.StringField()
	
class Project(mongoengine.Document):
	user = mongoengine.ReferenceField('User', dbref=True) # ^^^ points to User model ^^^
	title = mongoengine.StringField()
	pitch = mongoengine.StringField()
	description = mongoengine.StringField()
	year = mongoengine.IntField()
	images = mongoengine.ListField( mongoengine.EmbeddedDocumentField(Image) )
	thumbnail = mongoengine.StringField()
	thumbnailHover = mongoengine.StringField()
	media = mongoengine.StringField()
	problema = mongoengine.StringField()
	rank = mongoengine.IntField()
	archive = mongoengine.StringField()
	timestamp = mongoengine.DateTimeField(default=datetime.now())

class Problem(mongoengine.Document):
	name = mongoengine.StringField()
	
class Info(mongoengine.Document):
	title = mongoengine.StringField()
	pitch = mongoengine.StringField()
	bio = mongoengine.StringField()
	resume = mongoengine.StringField()
	photo = mongoengine.StringField()
	email = mongoengine.StringField()
	phone = mongoengine.StringField()
	address = mongoengine.StringField()
	
ProjectForm = model_form(Project)


	

