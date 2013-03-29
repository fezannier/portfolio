# -*- coding: utf-8 -*-
import os, datetime, re, sys
from flask import Flask, request, render_template, redirect, abort, session, url_for, json, jsonify, flash, redirect, escape, Response
import flask.views
from werkzeug import secure_filename
import logging
from logging import FileHandler
import subprocess
# import all of mongoengine
from flask.ext.mongoengine import mongoengine
# import data models
import models
# Python Image Library
import StringIO
from math import ceil
# to generate unique id for saving movie's frames
import uuid
#to send the video compressed
import zipfile
#to download file from URLs
import urllib
import errno
import commands

# logging settings
file_handler = logging.FileHandler('/home/flask_apps/public_html/logs/info.log', mode='a', encoding=None, delay=False) 
file_handler.setLevel(logging.INFO)

# Flask-Login 
from flask.ext.login import (LoginManager, current_user, login_required,
                            login_user, logout_user, UserMixin, AnonymousUser,
                            confirm_login, fresh_login_required)

# Library
from flaskext.bcrypt import Bcrypt

#custom user library - maps User object to User model
from libs.user import *

app = Flask(__name__)
app.debug = True

# Flask BCrypt will be used to salt the user password
flask_bcrypt = Bcrypt(app)
UPLOAD_FOLDER = '/home/flask_apps/public_html/apps/myPortfolio/static/uploads/'
app.secret_key = os.environ.get('SECRET_KEY') # put SECRET_KEY variable inside .env file with a random string of alphanumeric characters
app.config['CSRF_ENABLED'] = False
app.config['MAX_CONTENT_LENGTH'] = 4000 * 1024 * 1024 # 16 megabyte file upload

# --------- Database Connection ---------
# MongoDB connection to MongoLab's database
mongoengine.connect('portfolio')

# constant vars => app settings
ALLOWED_EXTENSIONS = set(['jpg','png','gif'])
#items per page (PAGINATION SETTINGS)
PER_PAGE = 6


# Login management defined
# reference http://packages.python.org/Flask-Login/#configuring-your-application
login_manager = LoginManager()
login_manager.anonymous_user = Anonymous
login_manager.login_view = "login"
login_manager.login_message = u"Please log in to access this page."
login_manager.refresh_view = "reauth"


# --------- Routes ----------

# Flask-Login requires a 'user_loader' callback 
# This method will called with each Flask route request automatically
# When this callback runs, it will populate the User object, current_user
# reference http://packages.python.org/Flask-Login/#how-it-works
@login_manager.user_loader
def load_user(id):
	if id is None:
		redirect('/portfolio/login')

	user = User()
	user.get_by_id(id)
	if user.is_active():
		return user
	else:
		return None

# connect the login manager to the main Flask app
login_manager.setup_app(app)

# main route - display all projects
@app.route('/', methods=["GET", "POST"])
def index():
	projects = models.Project.objects(archive__ne="archive")
	prj_sorted = sorted(projects, key=lambda project: project['rank'])
	templateData = {
		'projects' : prj_sorted,
		'info' : models.Info.objects()
	}
	return render_template('home.html', **templateData)

# main route - display all projects
@app.route('/archive', methods=["GET", "POST"])
def archive():
	projects = models.Project.objects(archive="archive")
	prj_sorted = sorted(projects, key=lambda project: project['rank'])
	templateData = {
		'projects' : prj_sorted,
		'info' : models.Info.objects()
	}
	return render_template('archive.html', **templateData)

#----------------------------
#UNCOMMENT TO ADD A NEW USER 
#----------------------------
#
# Register new user
#
@app.route("/register", methods=['GET','POST'])
def register():
	
	 #prepare registration form 
	registerForm = models.SignupForm(request.form)
	app.logger.info(request.form)

	if request.method == 'POST' and registerForm.validate():
		username = request.form['username']

		 #generate password hash
		password_hash = flask_bcrypt.generate_password_hash(request.form['password'])
 		
 		 #prepare User
 		user = User(username=username, password=password_hash)
 		
 		 #save new user, but there might be exceptions (uniqueness of username)
 		try:
 			user.save()	
 			if login_user(user, remember="no"):
 				flash("Logged in!")
 				return redirect(request.args.get("next") or '/portfolio')
 			else:
 				flash("unable to log you in")
 
 		 #got an error, most likely a uniqueness error
 		except mongoengine.queryset.NotUniqueError:
 			e = sys.exc_info()
 			exception, error, obj = e
 			
 			app.logger.error(e)
 			app.logger.error(error)
 			app.logger.error(type(error))
 	
 			if str(error).find("username") > -1:
 				flash("Username is already registered. Pick another.","register")
 
 			app.logger.error(error)	
 
 	# prepare registration form			
 	templateData = {
 		'form' : registerForm
 	}
 	
 	return render_template("/auth/register.html", **templateData)

	
# Login route - will display login form and receive POST to authenicate a user
@app.route("/login", methods=["GET", "POST"])
def login():

	# get the login and registration forms
	loginForm = models.LoginForm(request.form)
	
	# is user trying to log in?
	# 
	if request.method == "POST":
		username = request.form["username"]
		user = User().get_by_username_w_password(username)
		
		# if user in database and password hash match then log in.
	  	if user and flask_bcrypt.check_password_hash(user.password,request.form["password"]) and user.is_active():
			remember = request.form.get("remember", "no") == "yes"

			if login_user(user, remember=remember):
				flash("Logged in!")
				return redirect('/portfolio/admin')
			else:

				flash("unable to log you in","login")
	
		else:
			flash("Incorrect username and password submission","login")
			return redirect("/portfolio/login")

	else:

		templateData = {
			'form' : loginForm
		}

		return render_template('/auth/login.html', **templateData)

@app.route('/upload', methods=['GET','POST'])
@login_required
def upload():
	if request.method == "POST":
		type = request.form.get('type')
		id = request.form.get('id')
		uploaded_files = flask.request.files.getlist('file[]')
		if type == 'photo':
			info = models.Info.objects.get()
			for f in range(0,len(uploaded_files)):
				filename = secure_filename(uploaded_files[f].filename)
				uploaded_files[f].save(UPLOAD_FOLDER + 'info/' + filename)
				info.photo = filename
				info.save()
				return 'success'
		else:
			project = models.Project.objects.get(id=id)
			for f in range(0,len(uploaded_files)):
				filename = secure_filename(uploaded_files[f].filename)
				if uploaded_files[f] and allowed_file(filename):
					uploaded_files[f].save(UPLOAD_FOLDER + id + '/' + filename)
					if type == 'image':
						image = models.Image()
						image.filename = filename
						project.images.append(image)
					elif type == 'thumb':
						project.thumbnail = filename
					elif type == 'thumb_hover':
						project.thumbnailHover = filename
			project.save()
			return 'success'

@app.route('/uploadResume', methods=['GET','POST'])
def upload_resume():
	uploaded_file = request.files['file']
	info = models.Info.objects.get()
	filename = secure_filename(uploaded_file.filename)
	if filename != "":
		uploaded_file.save(UPLOAD_FOLDER + 'info/' + filename)
		info.resume = filename
		info.save()
	prj_selected = models.Project.objects(archive__ne="archive")
	prj_archived = models.Project.objects(archive="archive")
	prj_selected_sorted = sorted(prj_selected, key=lambda project: project['rank'])
	prj_archived_sorted = sorted(prj_archived, key=lambda project: project['rank'])
	archived_count = models.Project.objects(archive="archive").count()
	selected_count = models.Project.objects().count() - archived_count
	templateData = {
		'selected' : prj_selected_sorted,
		'archived' : prj_archived_sorted,
		'selectedCount' : selected_count,
		'archivedCount' : archived_count,
		'info': models.Info.objects()
		}
	return render_template('admin.html', **templateData)

@app.route('/project', methods=['GET','POST'])
def project():
	id = request.args.get('id')
	project = models.Project.objects.get(id=id)
	templateData = {
		'project': project,
		'info' : models.Info.objects()
	}
	return render_template('project.html', **templateData)

@app.route('/files', methods=['GET','POST'])
def files():
	info = models.Info.objects.limit(1)
	templateData = {
		'info' : info
	}
	return render_template('files.html', **templateData)

@app.route('/new', methods=['GET','POST'])
@login_required
def new_project():
	rank = models.Project.objects.count()
	projectForm = models.ProjectForm(request.form)
	project = models.Project()
	project.rank = rank + 1
	project.save()
	projectFolder = '/home/flask_apps/public_html/apps/myPortfolio/static/uploads/' + str(project.id) 
# 	if not os.path.exists(projectFolder): 
# 		os.makedirs(projectFolder)
	make_sure_path_exists(projectFolder)
	templateData = {
			'current_user' : current_user,
			'form' : projectForm,
			'project' : project,
			'formType' : 'New'
		}
	return render_template('new.html', **templateData)

@app.route('/edit', methods=["GET", "POST"])
def edit():
	id = request.args.get('id')
	project = models.Project.objects.get(id=id)
	templateData = {
		'project' : project
	}
	return render_template('edit.html', **templateData)

@app.route('/delete', methods=['GET','POST'])
@login_required
def delete_project():
	id = request.form.get('id')
	if id == "-1":
		info = models.Info.objects.get()
		if str(info.photo) != 'None':
 			os.remove(UPLOAD_FOLDER + 'info/' + str(info.photo))
		info.photo = ""
		info.save()
		return 'success'
	else:
		project = models.Project.objects.get(id=id)
		deleteDir(UPLOAD_FOLDER + id)
	# for img in project.images:
# 		app.logger.debug(UPLOAD_FOLDER + img.filename)
# 		if str(img.filename) != 'None':
# 			os.remove(UPLOAD_FOLDER + str(img.filename))
# 	if str(project.thumbnail) != 'None':
# 		os.remove(UPLOAD_FOLDER + str(project.thumbnail))
# 	if str(project.thumbnailHover) != 'None':
# 		os.remove(UPLOAD_FOLDER + str(project.thumbnailHover))
		project.delete()
		return 'success'

@app.route('/save', methods=['GET','POST'])
@login_required
def save_project():
	id = request.form.get('id')
	title = request.form.get('title')
	pitch = request.form.get('pitch')
	description = request.form.get('description')
	year = request.form.get('year')
	archive = request.form.get('archive')
	media = request.form.getlist('media[]')
	problems = request.form.getlist('problems[]')
	project = models.Project.objects.get(id=id)
	project.title = title
	project.pitch = pitch
	project.description = description
	project.year = year
	project.archive = archive
	problemStr = ""
	for p in problems:
		problemStr = problemStr + str(p) + ','
	project.problema = problemStr
	mediaStr = ""
	for m in media:
		mediaStr = mediaStr + str(m) + ','
	project.media = mediaStr
	project.save()
	prj_selected = models.Project.objects(archive__ne="archive")
	prj_archived = models.Project.objects(archive="archive")
	prj_selected_sorted = sorted(prj_selected, key=lambda project: project['rank'])
	prj_archived_sorted = sorted(prj_archived, key=lambda project: project['rank'])
	archived_count = models.Project.objects(archive="archive").count()
	selected_count = models.Project.objects().count() - archived_count
	templateData = {
		'selected' : prj_selected_sorted,
		'archived' : prj_archived_sorted,
		'selectedCount' : selected_count,
		'archivedCount' : archived_count,
		'info': models.Info.objects()
		}
	return render_template('admin.html', **templateData)

@app.route('/rank', methods=['GET','POST'])
@login_required
def rank_project():
	id_1 = request.form.get('id_1')
	rank_1 = request.form.get('rank_1')	
	id_2 = request.form.get('id_2')
	rank_2 = request.form.get('rank_2')	
	project_1 = models.Project.objects.get(id=id_1)
	project_1.rank = rank_1
	project_1.save()
	project_2 = models.Project.objects.get(id=id_2)
	project_2.rank = rank_2
	project_2.save()
	return 'success'

@app.route('/media', methods=['GET','POST'])
def get_media():
	media = models.Medium.objects()
	json = '{'
	for medium in media:
		json = json + '"' + str(medium.id) + '":"' + str(medium.type) + '"' + ','
	if len(json) > 2:
		json = json[:-1]
	json = json + "}"
	app.logger.debug(json)
	resp = flask.Response(response=json, status=200, headers=None, mimetype='application/json', content_type=None, direct_passthrough=False)
	return resp

@app.route('/problems', methods=['GET','POST'])
def get_problems():
	problems = models.Problem.objects()
	json = '{'
	for problem in problems:
		json = json + '"' + str(problem.id) + '":"' + str(problem.name) + '"' + ','
	if len(json) > 2:
		json = json[:-1]
	json = json + "}"
	app.logger.debug(json)
	resp = flask.Response(response=json, status=200, headers=None, mimetype='application/json', content_type=None, direct_passthrough=False)
	return resp

@app.route('/loadProject', methods=['GET','POST'])
def load_project():
	id = request.form.get('id')
	project = models.Project.objects.get(id=id)
	json = '{'
	if str(project.media) != 'None':
		json = json + '"media":"' + str(project.media) + '",'
	if str(project.year) != 'None':
		json = json + '"year":"' + str(project.year) + '",'
	if str(project.thumbnail) != 'None':
		json = json + '"thumbnail":"' + str(project.thumbnail) + '",'
	if str(project.thumbnailHover) != 'None':
		json = json + '"thumbnailHover":"' + str(project.thumbnailHover) + '",'	
	if str(project.problema) != 'None':
		json = json + '"problems":"' + str(project.problema) + '",'	
	if str(project.archive) != 'None':
		json = json + '"archive":"archive",'	
	json = json + '"images":{'
	for img in project.images:
		json = json + '"' + str(img.filename) + '":"' + str(img.caption) + '"' + ','
	if len(project.images) != 0:
		json = json[:-1]
	json = json + '}}'
	app.logger.debug(json)
	resp = flask.Response(response=json, status=200, headers=None, mimetype='application/json', content_type=None, direct_passthrough=False)
	return resp

@app.route('/filter', methods=['GET','POST'])
def filter_project():
	id = request.form.get('problem')
	problem = models.Problem.objects.get(id=id)
	projects = models.Project.objects()
	prj_sorted = sorted(projects, key=lambda project: project['rank'])
	prbStr = str(problem.id.__str__().decode('utf-8'))
	prjJson = '{"projects":['
	for project in  prj_sorted:
		if str(project.problema) != 'None':
			if prbStr in project.problema: 
				prjJson = prjJson + '"' + project.id.__str__().decode('utf-8') + '",'
	prjJson = prjJson[:-1]
	prjJson = prjJson + ']}'
	resp = flask.Response(response=prjJson, status=200, headers=None, mimetype='application/json', content_type=None, direct_passthrough=False)
	return resp
	

@app.route('/medium', methods=['GET','POST'])
def add_medium():
	type = request.form.get('medium')
	medium = models.Medium()
	app.logger.debug(type)
	medium.type = type
	medium.save()
	json = '{"' + str(medium.id) + '":"' + str(medium.type) + '"}'
	resp = flask.Response(response=json, status=200, headers=None, mimetype='application/json', content_type=None, direct_passthrough=False)
	return resp

@app.route('/problem', methods=['GET','POST'])
def add_problem():
	problem = request.form.get('problem')
	newProblem = models.Problem()
	newProblem.name = problem
	newProblem.save()
	json = '{"' + str(newProblem.id) + '":"' + str(newProblem.name) + '"}'
	resp = flask.Response(response=json, status=200, headers=None, mimetype='application/json', content_type=None, direct_passthrough=False)
	return resp

@app.route('/deleteImg', methods=['GET','POST'])
@login_required
def delete_image():
	id = request.form.get('id')
	filename = secure_filename(request.form.get('filename'))
	type = request.form.get('type')
	app.logger.debug(filename)
	project = models.Project.objects.get(id=id)
	if type =='image':
		for img in project.images:
			if str(img.filename) == filename:
				app.logger.debug(UPLOAD_FOLDER + id + '/' + str(img.filename))
				os.remove(UPLOAD_FOLDER + id + '/' + str(img.filename))
				models.Project.objects(id=id).update_one(pull__images__filename=filename)
				project.save()
	elif type == 'thumb':
		os.remove(UPLOAD_FOLDER + id + '/' + str(project.thumbnail))
		project.thumbnail = ""
		project.save()
	elif type == 'thumb_hover':
		os.remove(UPLOAD_FOLDER + id + '/' + str(project.thumbnailHover))
		project.thumbnailHover = ""
		project.save()
	return 'success'
	
@app.route('/caption', methods=['GET','POST'])
@login_required
def caption_image():
	id = request.form.get('id')
	filename = request.form.get('filename')
	caption = request.form.get('caption')
	project = models.Project.objects.get(id=id)
	for img in project.images:
		if str(img.filename) == filename:
			img.caption = caption
			project.save()
	return 'success'


@app.route('/info', methods=['GET','POST'])
@login_required
def get_info():
	title = request.form.get('title')
	pitch = request.form.get('pitch')
	bio = request.form.get('bio')
	email = request.form.get('email')
	address = request.form.get('address')
	phone = request.form.get('phone')
	info = models.Info.objects.get()
	resume = info.resume
	photo = info.photo
	info = models.Info.objects()
	info.delete()
	app.logger.debug(title)
	app.logger.debug(pitch)
	app.logger.debug(bio)
	newInfo = models.Info()
	newInfo.title = title
	newInfo.pitch = pitch
	newInfo.bio = bio
	newInfo.email = email
	newInfo.photo = photo
	newInfo.resume = resume
	newInfo.address = address
	newInfo.phone = phone
	newInfo.save()
	prj_selected = models.Project.objects(archive__ne="archive")
	prj_archived = models.Project.objects(archive="archive")
	prj_selected_sorted = sorted(prj_selected, key=lambda project: project['rank'])
	prj_archived_sorted = sorted(prj_archived, key=lambda project: project['rank'])
	archived_count = models.Project.objects(archive="archive").count()
	selected_count = models.Project.objects().count() - archived_count
	templateData = {
		'selected' : prj_selected_sorted,
		'archived' : prj_archived_sorted,
		'selectedCount' : selected_count,
		'archivedCount' : archived_count,
		'info': models.Info.objects()
		}
	return render_template('admin.html', **templateData)
@app.route('/admin', methods=['GET','POST'])
@login_required
def admin_main():
	prj_selected = models.Project.objects(archive__ne="archive")
	prj_archived = models.Project.objects(archive="archive")
	prj_selected_sorted = sorted(prj_selected, key=lambda project: project['rank'])
	prj_archived_sorted = sorted(prj_archived, key=lambda project: project['rank'])
	archived_count = models.Project.objects(archive="archive").count()
	selected_count = models.Project.objects().count() - archived_count
	templateData = {
		'selected' : prj_selected_sorted,
		'archived' : prj_archived_sorted,
		'selectedCount' : selected_count,
		'archivedCount' : archived_count,
		'info': models.Info.objects()
		}
	return render_template('admin.html', **templateData)
	
@app.route('/about', methods=['GET','POST'])
def about():
	templateData = {
		'info': models.Info.objects()
		}
	return render_template('about.html', **templateData)

# @app.route('/contact', methods=['GET','POST'])
# def contact():
# 	templateData = {
# 		'info': models.Info.objects()
# 		}
# 	return render_template('contact.html', **templateData)
	
@app.route("/reauth", methods=["GET", "POST"])
@login_required
def reauth():
    if request.method == "POST":
        confirm_login()
        flash(u"Reauthenticated.")
        return redirect(request.args.get("next") or url_for("index"))
    
    templateData = {}
    return render_template("/auth/reauth.html", **templateData)

@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Logged out.")
    return redirect(url_for("index"))

# paginates the gallery
@app.route('/', defaults={'page': 1})
@app.route('/page/<int:page>')
def gallery(page):
	count = count_all_projects()
	projects = get_projects_for_page(page, PER_PAGE, count)
	if page != 1:
		abort(404)
	pagination = Pagination(page, PER_PAGE, count)
	return render_template('projects.html',
		pagination=pagination,
		projects=projects
	)

@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404

def allowed_file(filename):
    return '.' in filename and \
           filename.lower().rsplit('.', 1)[1] in ALLOWED_EXTENSIONS
	
def count_all_projects():
	count = models.Project.objects().count()
	return count

def get_projects_for_page(page, PER_PAGE, count):
	skip = (page - 1) * PER_PAGE
	screenshots = models.Project.objects().limit(PER_PAGE).skip(skip)
	return screenshots
	
def url_for_other_page(page):
	args = request.view_args.copy()
	args['page'] = page
	return flask.url_for(request.endpoint, **args)
app.jinja_env.globals['url_for_other_page'] = url_for_other_page

def datetimeformat(value, format='%H:%M / %d-%m-%Y'):
    return value.strftime(format)
    
class Pagination(object):

    def __init__(self, page, per_page, total_count):
        self.page = page
        self.per_page = per_page
        self.total_count = total_count

    @property
    def pages(self):
        return int(ceil(self.total_count / float(self.per_page)))

    @property
    def has_prev(self):
        return self.page > 1

    @property
    def has_next(self):
        return self.page < self.pages

    def iter_pages(self, left_edge=5, left_current=5,
                   right_current=5, right_edge=5):
        last = 0
        for num in xrange(1, self.pages + 1):
            if num <= left_edge or \
               (num > self.page - left_current - 1 and \
                num < self.page + right_current) or \
               num > self.pages - right_edge:
                if last + 1 != num:
                    yield None
                yield num
                last = num

def make_sure_path_exists(path):
	try:
		os.makedirs(path)
	except OSError as exception:
		if exception.errno != errno.EEXIST:
			raise
def getstatusoutput(cmd):
	return commands.getstatusoutput(cmd)
	
def deleteDir(path):
	cmd = "rm -rf "+path
	result = getstatusoutput(cmd)

# --------- Server On ----------
# start the webserver
if __name__ == "__main__":
	app.debug = True
	app.logger.addHandler(file_handler)
	app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
 	app.config['SERVER_NAME'] = 'cisonogiatutte.com/portfolio'
	port = int(os.environ.get('PORT', 5000)) # locally PORT 5000, Heroku will assign its own port
	app.run(host='0.0.0.0', port=port)



	
