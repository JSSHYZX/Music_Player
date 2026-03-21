import os
import random
from flask import Flask, render_template, render_template_string, url_for, redirect, request, jsonify, send_from_directory
import glob

app = Flask(__name__)

# 配置
app.config['VIDEO_FOLDER'] = 'fvideos'
app.config['IMAGE_FOLDER'] = 'images'
app.config['LYRIC_FOLDER'] = 'flyrics'
app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'avi', 'mov', 'mkv', 'webm'}
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB 文件大小限制

# 确保视频文件夹存在
if not os.path.exists(app.config['VIDEO_FOLDER']):
    os.makedirs(app.config['VIDEO_FOLDER'])


def get_video_files():
    """获取视频文件夹中的所有视频文件"""
    video_files = []
    for ext in app.config['ALLOWED_EXTENSIONS']:
        video_files.extend(glob.glob(f"{app.config['VIDEO_FOLDER']}/*.{ext}"))

    # 只返回文件名，并排序
    video_files = [os.path.basename(f) for f in video_files]
    video_files.sort()
    return video_files


def get_lyric_Foreign():
    """获取视频文件夹中的所有歌词文件"""
    lyric_files = []
    videos = get_video_files()
    if len(videos):
        for video in videos:
            try:
                v = app.config['LYRIC_FOLDER'] + "/foreign/" + video[0:-4] + ".txt"
                file = open(v, "r", encoding="utf-8")
                file.readline()
                lyric = file.read()
                file.close()
                lyric = lyric.replace('\n', '<br>')
                lyric_files.append(lyric)
            except:
                lyric_files.append('No Lyric')
        return lyric_files
    else:
        return lyric_files


def get_lyric_Chinese():
    """获取视频文件夹中的所有歌词文件"""
    lyric_files = []
    videos = get_video_files()
    if len(videos) :
        for video in videos:
            try:
                v = app.config['LYRIC_FOLDER'] + "/chinese/"+video[0:-4] + ".txt"
                file = open(v, "r", encoding="utf-8")
                file.readline()
                lyric = file.read()
                file.close()
                lyric = lyric.replace('\n','<br>')
                lyric_files.append(lyric)
            except:
                lyric_files.append('No lyric')
        return lyric_files
    else:
        return lyric_files

def is_video_file(filename):
    """检查文件是否为视频文件"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


@app.route('/')
@app.route('/index')
@app.route('/home')
def index():
    """主页"""
    return render_template('index.html',folderPath = app.config['VIDEO_FOLDER'])

@app.route('/change/<file>')
@app.route('/goto/<file>')
@app.route('/go/<file>')
def change(file):
    if 'root' in file or 'r' in file or file == 'videos' or file == 'video':
        app.config['VIDEO_FOLDER'] = 'videos'
    elif 'videos ' in file or 'videos_' in file:
        app.config['VIDEO_FOLDER'] = 'videos/'+file[7:]
    elif 'video ' in file or 'video_' in file:
        app.config['VIDEO_FOLDER'] = 'videos/'+file[6:]
    elif file == 'Hatsune Miku':
        return redirect('https://mzh.moegirl.org.cn/%E5%88%9D%E9%9F%B3%E6%9C%AA%E6%9D%A5')
    elif file[0] == '$':
        app.config['VIDEO_FOLDER'] = file[1:]
    else:
        app.config['VIDEO_FOLDER'] = 'videos/'+file
    return redirect(url_for('index'))

@app.route('/path_submit',methods=['POST','GET'])
def path_submit():
    if request.method == 'POST':
        vp = request.form.get('video_path')
        lp = request.form.get('lyric_path')
        if vp:
            app.config['VIDEO_FOLDER'] = vp
        if lp:
            app.config['LYRIC_FOLDER'] = lp
    else:
        vp = request.args.get('video_path')
        lp = request.args.get('lyric_path')
        if vp:
            app.config['VIDEO_FOLDER'] = vp
        if lp:
            app.config['LYRIC_FOLDER'] = lp
    return redirect(url_for('about'))

@app.route('/about')
def about():
    about_html = '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
    <link rel="stylesheet" href="{{ url_for('static', filename='font-awesome/css/all.min.css') }}">
    <!--
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    -->
    <!--
    <style>
    .about {
        text-align:center;
    }
    </style>
    -->
</head>
<body>
    <h1>About</h1>
    <div class="about">
        <h3>一个视频播放器By QiLin</h3>
        <p>(听歌用)</p>
        <br><br>
        <h5>使用说明:</h5>
        <p>1.根目录:播放器主界面</p>
        <p>2."/video+'Filename'"提供视频(目录:VIDEOFOLDER)</p>
        <p>3."/image+'Filename'"提供图片(目录:IMAGEFOLDER)</p>
        <p>4."/goto+'File'" or "/go+'File'" or "/change+'File'更改VIDEOFOLDER</p>
        <br>
        <h6>当前VIDEOFOLDER: "{{VIDEOFOLDER}}"</h6>
        <h6>当前IMAGEFOLDER: "{{IMAGEFOLDER}}"</h6>
        <h6>当前LYRICFOLDER: "{{LYRICFOLDER}}"</h6>
        <br><br>
        <h5>当前可用路径:</h5>
        <p><a href="{{url_for('path_submit', video_path='videos', lyric_path='lyrics')}}">root</a></p>
        <p><a href="{{url_for('path_submit', video_path='videos/Tom and Jerry', lyric_path='None')}}">猫和老鼠</a></p>
        <p><a href="{{url_for('path_submit', video_path='D:/Music/「Hello」初音ミク特别演唱会（20260214夜公演）', lyric_path='D:/Music/「Hello」初音ミク特别演唱会（20260214夜公演）')}}">初音未来2026.2.14演唱会</a></p>
        <p><a href="{{url_for('path_submit', video_path='D:/Music/「Hello」初音ミク特别演唱会（20260214夜公演）/Songs-Origin', lyric_path='D:/Music/「Hello」初音ミク特别演唱会（20260214夜公演）')}}">演唱会 原曲</a></p>
        <br>
        <form action="/path_submit" method="post">
            <input type="text" name="file" placeholder="请输入跳转地址" size="50">
            <button type="submit">跳转</button>
        </form>
        <br><br>
        <h4><a href="/">返回index</a></h4>
    </div>
</body>
'''
    return render_template_string(about_html,
                                  VIDEOFOLDER=app.config['VIDEO_FOLDER'],
                                  IMAGEFOLDER=app.config['IMAGE_FOLDER'],
                                  LYRICFOLDER=app.config['LYRIC_FOLDER'])

@app.route('/api/videos')
def get_videos():
    """获取视频列表的API接口"""
    videos = get_video_files()
    return jsonify(videos)

@app.route('/api/lyrics_foreign')
def get_lyric_foreign():
    lyrics = get_lyric_Foreign()
    return jsonify(lyrics)

@app.route('/api/lyric_chinese')
def get_lyric_chinese():
    lyrics = get_lyric_Chinese()
    return jsonify(lyrics)

@app.route('/video/<path:filename>')
def serve_video(filename):
    """提供视频文件"""
    return send_from_directory(app.config['VIDEO_FOLDER'], filename)

@app.route('/image/<path:filename>')
def serve_image(filename):
    """提供图片文件"""
    return send_from_directory(app.config['IMAGE_FOLDER'], filename)

@app.route('/api/upload', methods=['POST'])
def upload_video():
    """上传视频文件"""
    if 'file' not in request.files:
        return jsonify({'error': '没有选择文件'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400

    if file and is_video_file(file.filename):
        filename = os.path.join(app.config['VIDEO_FOLDER'], file.filename)
        file.save(filename)
        return jsonify({'success': True, 'filename': file.filename})

    return jsonify({'error': '不支持的文件格式'}), 400


@app.route('/api/delete/<path:filename>', methods=['DELETE'])
def delete_video(filename):
    """删除视频文件"""
    try:
        filepath = os.path.join(app.config['VIDEO_FOLDER'], filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            return jsonify({'success': True})
        return jsonify({'error': '文件不存在'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)