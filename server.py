import paramiko
import json

from flask import send_file,request
from flask import Flask
import os
from flask_cors import CORS
import argparse

hostname = ""
port = 22
username = ""
password = ""


def serverConnect():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname, port, username, password)
    return ssh


ssh = serverConnect()
read_path = ''
image_list_with_path = []
image_list=[]


sftp_client = ssh.open_sftp()


app = Flask(__name__)
CORS(app,supports_credentials=True)

@app.route('/ass',methods=['GET','POST'])
def hello():
    global read_path
    read_path=request.values.get('search_path_backend')
    dict = {}
    j_dict = json.dumps(dict)
    return j_dict


@app.route('/download_test/<img_name>',methods=['GET','POST'])
def download_test(img_name):
    #print(img_name_with_path)
    '''
    print(json.loads(request.data.decode()))
    img_wanted=json.loads(request.data.decode())['name']
    print('imdada',img_wanted)
    img_path=path+img_wanted
    print(img_path)
    #return send_file('./data/baby.png',as_attachment=True,download_name='test.png')
    '''
    #with sftp_client.open(image_list[1]) as f:
    global read_path

    img_wanted=read_path+'/'+img_name
    f = sftp_client.open(img_wanted, 'r')
    f.prefetch()
    return send_file(f, as_attachment=True, download_name=img_name)


@app.route('/list_img',methods=['GET','POST'])
def img_list():
    stdin, stdout, stderr = ssh.exec_command('ls ' + read_path)
    res_list = stdout.readlines()

    image_list_with_path = []
    image_list = []
    for i in range(len(res_list)):
        if res_list[i][-3:]=='png' or 'jpg':
            a = res_list[i].replace('\n', '')
            image_list_with_path.append(read_path + "/" + a)
            image_list.append(a)

    return json.dumps(image_list)

if __name__=='__main__':
    app.run(port=5001,debug=True,threaded=False)
    sftp_client.close()


#from wsgiref.simple_server import make_server

#if __name__ == '__main__':
#    server = make_server('0.0.0.0', 5000, app)
#    server.serve_forever()
