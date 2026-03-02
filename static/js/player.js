first = 0;
class VideoPlayer {
    constructor() {
        this.videoElement = document.getElementById('videoPlayer');
        this.videoListElement = document.getElementById('videoList');
        this.currentVideoTitle = document.getElementById('currentVideoTitle');
        this.currentLyricForeign = document.getElementById('currentLyricForeign');
        this.currentLyricChinese = document.getElementById('currentLyricChinese');
        this.lyricTitle = document.getElementById('Lyric')
        this.videos = [];
        this.lyrics_foreign = [];
        this.lyrics_chinese = [];
        this.currentIndex = 0;
        this.playMode = 'shuffle'; // sequential, loop, shuffle
        this.isPlaying = false;
        this.shuffledList = [];
        this.init();
    }

    async init() {
        await this.loadVideos();
        this.setupEventListeners();
        this.updateModeButtons();
        this.setupDragAndDrop();
    }

    async loadVideos() {
        try {
            const response = await fetch('/api/videos');
            this.videos = await response.json();
            const response1 = await fetch('/api/lyrics_foreign');
            this.lyrics_foreign = await response1.json();
            const response2 = await fetch('/api/lyric_chinese');
            this.lyrics_chinese = await response2.json()

            this.shuffledList = [...this.videos];
            this.shuffleVideos();
            this.renderVideoList();
            first = Math.floor(Math.random() * (this.videos.length - 1));
            if (this.videos.length > 0) {
                this.loadVideo(first);
            }
        } catch (error) {
            console.error('加载视频列表失败:', error);
        }
    }

    renderVideoList() {
        if (this.videos.length === 0) {
            this.videoListElement.innerHTML = `
                <div class="empty-list">
                    <i class="fas fa-video-slash"></i>
                    <p>文件夹中没有视频文件</p>
                </div>
            `;
            return;
        }

        let html = '';
        this.videos.forEach((video, index) => {
            const isActive = index === this.currentIndex;
            html += `
                <div class="video-item ${isActive ? 'active' : ''}" data-index="${index}">
                    <div>
                        <i class="fas fa-video"></i>
                        ${video}
                    </div>
                    <button class="delete-btn" onclick="player.deleteVideo('${video}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });

        this.videoListElement.innerHTML = html;

        // 添加点击事件
        document.querySelectorAll('.video-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-btn')) {
                    const index = parseInt(item.dataset.index);
                    this.loadVideo(index);
                }
            });
        });
    }

    async loadVideo(index) {
        if (index < 0 || index >= this.videos.length) return;

        this.currentIndex = index;
        const videoFile = this.videos[index];

        this.videoElement.src = `/video/${encodeURIComponent(videoFile)}`;
        this.currentVideoTitle.textContent = videoFile;
        const showLyric = document.getElementById('showLyric').checked;
        if (showLyric){
            const lf = this.lyrics_foreign[index];
            const lc = this.lyrics_chinese[index];
            const lyricTitle = "Lyric for " + videoFile;
            this.lyricTitle.innerHTML = lyricTitle;
            this.currentLyricForeign.innerHTML = lf;
            this.currentLyricChinese.innerHTML = lc;
        }
        else{
            this.lyricTitle.innerHTML = "";
            this.currentLyricForeign.innerHTML = "";
            this.currentLyricChinese.innerHTML = "";
        }

        // 更新列表高亮
        document.querySelectorAll('.video-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        // 自动播放
        const autoPlay = document.getElementById('autoPlayNext').checked;
        if (autoPlay) {
            await this.videoElement.play();
            this.isPlaying = true;
            this.updatePlayButton();
        }
    }

    async playNext() {
        const autoPlayNext = document.getElementById('autoPlayNext').checked;
        if (!autoPlayNext) return;

        let nextIndex;

        switch (this.playMode) {
            case 'sequential':
                nextIndex = (this.currentIndex + 1) % this.videos.length;
                break;
            case 'loop':
                nextIndex = this.currentIndex; // 播放同一个视频
                break;
            case 'shuffle':
                const currentVideo = this.videos[this.currentIndex];
                const shuffledIndex = this.shuffledList.indexOf(currentVideo);
                nextIndex = this.videos.indexOf(
                    this.shuffledList[(shuffledIndex + 1) % this.shuffledList.length]
                );
                break;
        }

        this.loadVideo(nextIndex);
    }

    playPrev() {
        let prevIndex;

        switch (this.playMode) {
            case 'sequential':
                prevIndex = (this.currentIndex - 1 + this.videos.length) % this.videos.length;
                break;
            case 'loop':
                prevIndex = this.currentIndex;
                break;
            case 'shuffle':
                const currentVideo = this.videos[this.currentIndex];
                const shuffledIndex = this.shuffledList.indexOf(currentVideo);
                prevIndex = this.videos.indexOf(
                    this.shuffledList[(shuffledIndex - 1 + this.shuffledList.length) % this.shuffledList.length]
                );
                break;
        }

        this.loadVideo(prevIndex);
    }

    shuffleVideos() {
        for (let i = this.shuffledList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledList[i], this.shuffledList[j]] = [this.shuffledList[j], this.shuffledList[i]];
        }
    }

    togglePlayPause() {
        if (this.videoElement.paused) {
            this.videoElement.play();
            this.isPlaying = true;
        } else {
            this.videoElement.pause();
            this.isPlaying = false;
        }
        this.updatePlayButton();
    }

    updatePlayButton() {
        const icon = this.isPlaying ? 'fa-pause' : 'fa-play';
        document.querySelector('#playPauseBtn i').className = `fas ${icon}`;
    }

    updateModeButtons() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === this.playMode) {
                btn.classList.add('active');
            }
        });
    }

    async deleteVideo(filename) {
        if (!confirm(`确定要删除 "${filename}" 吗？`)) return;

        try {
            const response = await fetch(`/api/delete/${encodeURIComponent(filename)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadVideos();
            } else {
                const error = await response.json();
                alert('删除失败: ' + error.error);
            }
        } catch (error) {
            alert('删除失败: ' + error.message);
        }
    }

    async uploadVideo(files) {
        const uploadArea = document.getElementById('uploadArea');

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    console.log('上传成功:', result.filename);
                } else {
                    alert(`上传失败: ${result.error}`);
                }
            } catch (error) {
                alert(`上传失败: ${error.message}`);
            }
        }

        // 重新加载视频列表
        await this.loadVideos();
        uploadArea.style.background = '';
    }

    setupEventListeners() {
        // 播放/暂停按钮
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.togglePlayPause();
        });

        // 上一个/下一个按钮
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.playPrev();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.playNext();
        });

        // 全屏按钮
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            if (this.videoElement.requestFullscreen) {
                this.videoElement.requestFullscreen();
            }
        });

        // 音量控制
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.videoElement.volume = e.target.value;
            document.getElementById('muteAudio').checked = e.target.value > 0;
        });

        // 静音控制
        document.getElementById('muteAudio').addEventListener('change', (e) => {
            this.videoElement.muted = !e.target.checked;
            if (e.target.checked) {
                document.getElementById('volumeSlider').value = this.videoElement.volume;
            }
        });

        // 进度条
        document.getElementById('progressBar').addEventListener('input', (e) => {
            const time = (e.target.value / 100) * this.videoElement.duration;
            this.videoElement.currentTime = time;
        });

        // 视频时间更新
        this.videoElement.addEventListener('timeupdate', () => {
            const progress = (this.videoElement.currentTime / this.videoElement.duration) * 100 || 0;
            document.getElementById('progressBar').value = progress;

            // 更新时间显示
            document.getElementById('currentTime').textContent =
                this.formatTime(this.videoElement.currentTime);
            document.getElementById('totalTime').textContent =
                this.formatTime(this.videoElement.duration);
        });

        // 视频播放结束
        this.videoElement.addEventListener('ended', () => {
            this.playNext();
        });

        // 播放模式切换
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.playMode = btn.dataset.mode;
                if (this.playMode === 'shuffle') {
                    this.shuffleVideos();
                }
                this.updateModeButtons();
            });
        });

        // 刷新按钮
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadVideos();
        });

        // 文件上传
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.uploadVideo(e.target.files);
            e.target.value = ''; // 重置input
        });
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.background = '#ecf0f1';
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.background = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.background = '';

            const files = e.dataTransfer.files;
            const videoFiles = Array.from(files).filter(file =>
                file.type.startsWith('video/') ||
                ['.mp4', '.avi', '.mov', '.mkv', '.webm'].some(ext =>
                    file.name.toLowerCase().endsWith(ext))
            );

            if (videoFiles.length > 0) {
                this.uploadVideo(videoFiles);
            } else {
                alert('请拖放视频文件（MP4, AVI, MOV, MKV, WebM）');
            }
        });
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// 初始化播放器
const player = new VideoPlayer();
