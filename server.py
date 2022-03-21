import paramiko
import json
from datetime import timedelta
from flask import send_file, request
from flask import Flask
import os
from flask_cors import CORS
import argparse
from werkzeug.serving import WSGIRequestHandler

hostname = "xxx"
port = 22
username = "xxx"
password = "xxx"


def serverConnect():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname, port, username, password)
    return ssh


ssh = serverConnect()
sftp_client = ssh.open_sftp()

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(seconds=200)

CORS(app, supports_credentials=True)


@app.route('/query', methods=['GET', 'POST'])  # 用于和前端输入框自动补全，前端输入路径，返回文件目录
def send_files():
    global ssh
    global sftp_client
    ssh = serverConnect()
    sftp_client = ssh.open_sftp()
    file_path = request.values.get('read')
    keycode = request.values.get('keycode')
    if keycode == '191':
        file_path = file_path + '/'
    stdin, stdout, stderr = ssh.exec_command('ls ' + file_path)
    res_list = stdout.readlines()
    image_list = []
    file_name_list = []
    count_jpg = 0
    count_png = 0
    for i in range(len(res_list)):
        if res_list[i][-4:-1] == 'jpg':
            count_jpg = count_jpg + 1
            image_list.append(res_list[i].replace('\n', ''))
        if res_list[i][-4:-1] == 'png':
            count_png = count_png + 1
            image_list.append(res_list[i].replace('\n', ''))
        if '.' not in res_list[i]:
            file_name = file_path + res_list[i].replace('\n', '')
            file_name_list.append(file_name)

    return json.dumps({'file_list': file_name_list, 'num_jpg': count_jpg, 'num_png': count_png, 'img_list': image_list})

@app.route('/download', methods=['GET', 'POST'])  # 通过解析host/download?s_path=xxx&img=xxx的绝对路径去搜索图片
def send_images():
    global sftp_client
    read_file_path = request.args.get('s_path')
    img = request.args.get('img')
    img_wanted = read_file_path + '/' + img

    try:
        f = sftp_client.open(img_wanted, 'r')
        f.prefetch()
        return send_file(f, as_attachment=True, download_name=img)
    except IOError:
        return None


@app.route('/list_img', methods=['GET', 'POST'])  # 通过前端ajax发送的搜索路径read_ssh_path读取相应路径下的图片并返回所有的图片名称
def img_list():
    global ssh
    global sftp_client
    ssh = serverConnect()
    sftp_client = ssh.open_sftp()
    file_path = request.values.get('read_ssh_path')
    stdin, stdout, stderr = ssh.exec_command('ls ' + file_path)
    res_list = stdout.readlines()
    image_name_list = []
    for i in range(len(res_list)):
        if res_list[i][-3:] == 'png' or 'jpg':
            file_name = res_list[i].replace('\n', '')
            image_name_list.append(file_name)
    print(image_name_list)
    return json.dumps(image_name_list)


if __name__ == '__main__':
    # 0WSGIRequestHandler.protocol_version="HTTP/1.0"
    app.run('0.0.0.0',port=5001, debug=True, threaded=False)
    # sftp_client.close()

# from wsgiref.simple_server import make_server

# if __name__ == '__main__':
#    server = make_server('0.0.0.0', 5000, app)
#    server.serve_forever()
