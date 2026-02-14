from flask import Flask,render_template,jsonify,request
import atexit
import sqlite3
import json
from threading import Lock
from time import time
import os
def backup(conn1,conn2):
    cursor=conn1.cursor()
    comments=cursor.execute('SELECT * FROM COMMENT;').fetchall()
    danmu=cursor.execute('SELECT * FROM DANMU;').fetchall()
    cursor.close()
    conn1.close()
    cursor=conn2.cursor()
    try:
        cursor.execute('''CREATE TABLE COMMENT(
        ID INT PRIMARY KEY NOT NULL,
        NICKNAME TEXT NOT NULL,
        TIME INT NOT NULL,
        CONTENT TEXT NOT NULL
        );''')
        cursor.execute('''CREATE TABLE DANMU(
        ID INT PRIMARY KEY NOT NULL,
        CONTENT TEXT NOT NULL
        );''')
    except:
        pass
    for n in danmu:
        cursor.execute('INSERT INTO DANMU (ID,CONTENT) VALUES (%d,"%s");'%(n[0],n[1]))
    for n in comments:
        cursor.execute('INSERT INTO COMMENT (ID,NICKNAME,TIME,CONTENT) VALUES (%d,"%s",%d,"%s");'%(n[0],n[1],n[2],n[3]))
    cursor.close()
    conn1.close()
conn=sqlite3.connect(':memory:',check_same_thread=False)
backup(sqlite3.connect('danmu.db'),conn)
lock=Lock()
def saveDataExit():
    with lock:
        diskConn=sqlite3.connect('danmu.db')
        backup(conn,diskConn)
        diskConn.close()
atexit.register(saveDataExit)
def execute(expression):
    with lock:
        cursor=conn.cursor()
        value=cursor.execute(expression).fetchall()
        cursor.close()
    return value
def timeConvert(now,stamp):
    if now-stamp<60:
        return "刚刚"
    elif now-stamp<3600:
        return "%d分钟前"%((now-stamp)/60)
    elif now-stamp<86400:
        return "%d小时前"%((now-stamp)/3600)
    elif now-stamp<2592000:#86400*30
        return "%d天前"%((now-stamp)/86400)
    elif now-stamp<31536000:#86400*365
        return "%d个月前"%((now-stamp)/2628000)#86400*365/12
    else:
        return "%d年前"%((now-stamp)/31536000)#86400*365
app = Flask(__name__)
@app.route("/")
def landing():
    return render_template('mainpage.html',started=time()>1770998400)#2026/2/14 0:00:00
@app.route("/homepage")
def homepage():
    commentNum=execute('SELECT COUNT (*) FROM COMMENT;')[0][0]
    return render_template('firework2.html',commentNum=commentNum)
@app.route("/getDanmu")
def getDanmu():
    danmu=execute('SELECT CONTENT FROM DANMU;')
    danmu=[n[0] for n in danmu]+['']
    return jsonify(danmu)
@app.route("/sendDanmu")
def sendDanmu():
    content=request.args.get('content')
    length=execute('SELECT COUNT (*) FROM DANMU;')[0][0]
    execute('INSERT INTO DANMU (ID,CONTENT) VALUES (%d,"%s");'%(length,content))
    return "success"
@app.route("/getComment")
def getComment():
    comments=execute('SELECT * FROM COMMENT;')
    comments.sort()
    now=time()
    comments=[{'id':"#%d"%n[0],'nickname':n[1],'time':timeConvert(now,n[2]),'content':n[3]} for n in comments]
    return render_template('comment.html',comments=comments)
@app.route("/sendComment",methods=['POST'])
def sendComment():
    nickname=request.form.get('nickname')
    content=request.form.get('content')
    length=execute('SELECT COUNT (*) FROM COMMENT;')[0][0]
    execute('INSERT INTO COMMENT (ID,NICKNAME,TIME,CONTENT) VALUES (%d,"%s",%d,"%s");'%(length,nickname,time(),content))
    return "success"
@app.route("/requireAdmin",methods=['POST'])
def requireAdmin():
    password=request.form.get('password')
    if password=='caidan20260214' and not os.path.exists('./FORBIDCAIDAN'):
        caidan=render_template('caidan.html')
        os.mknod('./FORBIDCAIDAN')
        #os.remove('./templates/caidan.html')
        #os.remove('./static/fireworkLite.js')
        return jsonify({'success':True,'html':caidan})
    else:
        return jsonify({'success':False,'password':password})
if __name__=='__main__':
    app.run(host='0.0.0.0',port=5000,debug=False)
