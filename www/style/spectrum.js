(function(win){
    class AudioWave{
        constructor(player, canvasSelector){
            this.player = player;
            this.$canvas = $(canvasSelector);
            this.canvas = this.$canvas[0];
            this.ctx = null;
            this.audioCtx = null;
            this.analyser = null;
            this.source = null;
            this.rafId = null;
            this.enable = true;
            this.fftSize = 2048;
            this.barWidth = 4;      // 柱宽度
            this.barGap = 1;        // 柱间隙
            this.color = "rgb(64 174 255 / 45%)";
            this.gradient = true;   // 是否使用渐变色
            this.barHeightScale = 1; // 高度缩放系数（可调整）
            this.initCanvas();
        }
        initCanvas(){
            if(!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            $(win).on('resize', ()=>this.resize());
        }
        resize(){
            if(!this.canvas) return;
            this.canvas.width = this.$canvas[0].clientWidth;
            this.canvas.height = this.$canvas[0].clientHeight;
        }
        initAudio(){
            if(this.audioCtx) return;
            try{
                this.audioCtx = new (win.AudioContext || win.webkitAudioContext)();
                this.analyser = this.audioCtx.createAnalyser();
                this.analyser.fftSize = this.fftSize;
                const audioDom = this.player.audio;
                audioDom.crossOrigin = "anonymous";
                this.source = this.audioCtx.createMediaElementSource(audioDom);
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioCtx.destination);
            }catch(err){
                //console.error("AudioWave 初始化失败:", err);
            }
        }
        async start(){
            if(!this.enable) return;
            this.initAudio();
            if(!this.audioCtx) return;
            if(this.audioCtx.state === 'suspended'){
                await this.audioCtx.resume();
            }
            this.draw();
        }
        stop(){
            if(this.rafId){
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            this.clear();
        }
        clear(){
            this.ctx && this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        draw(){
            if(!this.enable || !this.analyser || !this.ctx){
                this.rafId = requestAnimationFrame(()=>this.draw());
                return;
            }
            const w = 2000;//this.canvas.width;
            const h = this.canvas.height;
            if(w <= 0 || h <= 0){
                this.rafId = requestAnimationFrame(()=>this.draw());
                return;
            }
            
            // 获取频域数据
            const bufferLen = this.analyser.frequencyBinCount;
            const dataArr = new Uint8Array(bufferLen);
            this.analyser.getByteFrequencyData(dataArr);
            
            this.ctx.clearRect(0, 0, w, h);

            // 关键改动：计算能放多少根柱子（铺满宽度）
            const totalBarWidth = this.barWidth + this.barGap;
            const visibleBars = Math.floor(w / totalBarWidth);
            
            // 降采样：从频域数据中取对应索引
            const step = Math.floor(bufferLen / visibleBars);
            
            // 创建渐变色
            if(this.gradient){
                const gradient = this.ctx.createLinearGradient(0, h, 0, 0);
                gradient.addColorStop(1, "rgb(128 0 128 / 25%)");
                gradient.addColorStop(0.6, "rgb(150 230 255 / 45%)");
                gradient.addColorStop(0.4, "rgb(100 200 255 / 45%)");
                gradient.addColorStop(0.2, "rgb(63 255 63 / 20%)");
                gradient.addColorStop(0, "rgb(255 251 53 / 45%)");
                this.ctx.fillStyle = gradient;
            } else {
                this.ctx.fillStyle = this.color;
            }

            // 绘制柱状频谱（铺满宽度）
            let x = 0;
            for(let i = 0; i < visibleBars; i++){
                const dataIndex = i * step;
                const barHeight = (dataArr[dataIndex] / 255) * h * this.barHeightScale;
                
                // 从底部向上绘制
                this.ctx.fillRect(x, h - barHeight, this.barWidth, barHeight);
                
                x += totalBarWidth;
            }
            
            this.rafId = requestAnimationFrame(()=>this.draw());
        }
        toggle(boo){
            this.enable = !!boo;
            this.enable ? this.start() : this.stop();
        }
    }
    
    win.AudioWave = AudioWave;
    //console.log("AudioWave 已加载，可调用 new AudioWave(...)");
})(window);