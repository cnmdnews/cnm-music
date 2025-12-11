import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Music, ListMusic, Heart, Shuffle, Repeat, Cloud, 
  Settings, RefreshCw, X, Plus, Link as LinkIcon
} from 'lucide-react';

// 默认初始歌曲 (本地演示)
const INITIAL_SONGS = [
  {
    id: 1,
    title: "Midnight City",
    artist: "Synthwave Boy",
    cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "from-purple-600 to-blue-600"
  },
  {
    id: 2,
    title: "Cloudflare 测试", 
    artist: "R2 Storage",
    cover: "https://images.unsplash.com/photo-1459749411177-0473ef4884f3?q=80&w=500&auto=format&fit=crop",
    // 你可以在这里替换成你的 R2 链接测试，或者在页面上添加
    url: "https://pub-bfe3ffdfc8804a3492bac5afc6c51844.r2.dev/test.mp3", 
    color: "from-orange-500 to-yellow-500"
  }
];

export default function App() {
  // --- 状态管理 ---
  const [songs, setSongs] = useState(INITIAL_SONGS);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // 弹窗状态
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // 添加单曲链接的状态
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");

  // Alist 配置状态 (从 localStorage 读取)
  const [alistConfig, setAlistConfig] = useState(() => {
    const saved = localStorage.getItem('alist_config');
    return saved ? JSON.parse(saved) : { url: '', token: '', path: '/Music' };
  });

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentSong = songs[currentSongIndex];

  // 持久化保存 Alist 配置
  useEffect(() => {
    localStorage.setItem('alist_config', JSON.stringify(alistConfig));
  }, [alistConfig]);

  // 播放/暂停控制
  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play().catch(e => {
        console.warn("播放失败，可能是因为浏览器限制自动播放或链接失效:", e);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSongIndex, songs]);

  // 音量控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // --- 核心功能函数 ---

  // 1. 下一首
  const nextSong = () => {
    setCurrentSongIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
  };

  // 2. 上一首
  const prevSong = () => {
    setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };

  // 3. 进度条更新
  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  };

  // 4. 拖拽进度条
  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // 5. 本地文件上传
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newSongs = files.map((file, index) => ({
      id: `local-${Date.now()}-${index}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "本地文件",
      cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop",
      url: URL.createObjectURL(file),
      color: "from-gray-700 to-gray-900"
    }));

    setSongs(prev => [...prev, ...newSongs]);
    setCurrentSongIndex(songs.length); 
    setIsPlaying(true);
    setShowPlaylist(true);
  };

  // 6. 添加单个网络链接
  const handleAddLink = () => {
    if (!newLinkUrl) return;
    const newSong = {
      id: `link-${Date.now()}`,
      title: newLinkTitle || "网络歌曲",
      artist: "云端直链",
      cover: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=500&auto=format&fit=crop",
      url: newLinkUrl,
      color: "from-indigo-600 to-blue-500"
    };
    setSongs(prev => [...prev, newSong]);
    setShowLinkModal(false);
    setNewLinkUrl("");
    setNewLinkTitle("");
    setCurrentSongIndex(songs.length);
    setIsPlaying(true);
  };

  // 7. Alist 批量导入
  const fetchAlistMusic = async () => {
    if (!alistConfig.url) return alert("请先填写 Alist 地址");
    setLoading(true);
    const baseUrl = alistConfig.url.replace(/\/$/, "");
    
    try {
      const response = await fetch(`${baseUrl}/api/fs/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': alistConfig.token
        },
        body: JSON.stringify({
          path: alistConfig.path,
          password: "",
          page: 1,
          per_page: 100,
          refresh: false
        })
      });

      const data = await response.json();

      if (data.code === 200 && data.data.content) {
        const musicFiles = data.data.content.filter(item => !item.is_dir);
        if (musicFiles.length === 0) {
          alert("该目录下没有找到文件，请检查路径是否正确");
          setLoading(false);
          return;
        }
        const newSongs = musicFiles.map(file => ({
          id: `alist-${file.name}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "云端音乐",
          cover: "https://images.unsplash.com/photo-1459749411177-0473ef4884f3?q=80&w=500&auto=format&fit=crop",
          url: `${baseUrl}/d${alistConfig.path}/${encodeURIComponent(file.name)}${file.sign ? `?sign=${file.sign}` : ''}`,
          color: "from-indigo-900 to-slate-900"
        }));
        setSongs(prev => [...prev, ...newSongs]);
        alert(`成功导入 ${newSongs.length} 首歌曲！`);
        setShowCloudModal(false);
      } else {
        alert("连接失败：" + (data.message || "未知错误"));
      }
    } catch (error) {
      console.error(error);
      alert("请求失败！请检查 Alist 地址和跨域(CORS)设置。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full bg-gradient-to-br ${currentSong.color || 'from-gray-900 to-black'} text-white flex flex-col items-center justify-center font-sans overflow-hidden transition-colors duration-700`}>
      {/* 核心修改：audio 标签配置 
        1. 移除了 crossOrigin="anonymous" (解决 R2/GitHub 403 问题)
        2. 添加了 referrerPolicy="no-referrer" (解决部分防盗链问题)
      */}
      <audio
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextSong}
        onLoadedMetadata={handleTimeUpdate}
        referrerPolicy="no-referrer"
        onError={(e) => {
          console.error("播放出错:", e);
          // 如果需要，可以在这里处理错误，例如自动切歌
        }}
      />

      {/* 隐藏的文件输入框 */}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" multiple className="hidden" />

      {/* 添加链接弹窗 */}
      {showLinkModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-white/20 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">添加网络链接</h3>
              <button onClick={() => setShowLinkModal(false)}><X size={24}/></button>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                placeholder="歌曲标题"
                className="w-full bg-white/10 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
              />
              <input 
                type="text" 
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://example.com/song.mp3"
                className="w-full bg-white/10 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
              />
              <button onClick={handleAddLink} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition">
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alist 配置弹窗 */}
      {showCloudModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><Cloud size={20} className="text-blue-400"/> Alist 导入</h3>
              <button onClick={() => setShowCloudModal(false)}><X size={24}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase">服务器地址</label>
                <input 
                  value={alistConfig.url}
                  onChange={e => setAlistConfig({...alistConfig, url: e.target.value})}
                  placeholder="https://alist.your-site.com"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase">文件夹路径</label>
                <input 
                  value={alistConfig.path}
                  onChange={e => setAlistConfig({...alistConfig, path: e.target.value})}
                  placeholder="/Music"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase">Token (可选)</label>
                <input 
                  type="password"
                  value={alistConfig.token}
                  onChange={e => setAlistConfig({...alistConfig, token: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <button 
                onClick={fetchAlistMusic}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={18} className="animate-spin"/> : <Cloud size={18} />}
                {loading ? "扫描中..." : "开始扫描"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 播放器主界面 */}
      <div className="relative w-full max-w-md h-[90vh] md:h-auto md:aspect-[9/16] md:max-h-[800px] bg-white/10 backdrop-blur-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col">
        
        {/* 顶部栏 */}
        <div className="flex justify-between items-center p-6 z-10">
          <button onClick={() => setShowPlaylist(!showPlaylist)} className="p-2 rounded-full hover:bg-white/10 transition">
            <ListMusic size={24} />
          </button>
          <div className="text-xs font-medium tracking-widest uppercase opacity-60 truncate max-w-[120px]">
            {currentSong.artist}
          </div>
          <div className="flex gap-1">
             <button onClick={() => setShowLinkModal(true)} className="p-2 rounded-full hover:bg-white/10 transition" title="添加链接">
              <LinkIcon size={20} />
            </button>
            <button onClick={() => setShowCloudModal(true)} className="p-2 rounded-full hover:bg-white/10 transition" title="Alist 设置">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* 封面区域 */}
        <div className={`relative flex-1 flex items-center justify-center p-8 transition-all duration-500 ${showPlaylist ? 'scale-90 opacity-0 hidden' : 'scale-100 opacity-100'}`}>
          <div className="w-64 h-64 md:w-72 md:h-72 relative group">
             <div className={`absolute inset-0 bg-gradient-to-tr ${currentSong.color} rounded-full blur-3xl opacity-50 animate-pulse`}></div>
             <img 
               src={currentSong.cover} 
               className={`w-full h-full object-cover rounded-3xl shadow-2xl transition-transform duration-700 ${isPlaying ? 'scale-100 rotate-0' : 'scale-95 rotate-1'}`} 
             />
          </div>
        </div>

        {/* 播放列表 */}
        <div className={`absolute inset-0 bg-black/90 backdrop-blur-xl z-20 transition-transform duration-300 flex flex-col ${showPlaylist ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold">播放列表 ({songs.length})</h2>
            <div className="flex gap-2">
              <button onClick={() => fileInputRef.current.click()} className="text-sm bg-white/10 px-3 py-1 rounded-lg hover:bg-white/20">上传本地</button>
              <button onClick={() => setShowPlaylist(false)}><X size={24}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
            {songs.map((song, i) => (
              <div 
                key={i} 
                onClick={() => { setCurrentSongIndex(i); setIsPlaying(true); }}
                className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-white/10 ${i === currentSongIndex ? 'bg-white/20' : ''}`}
              >
                <img src={song.cover} className="w-10 h-10 rounded-lg object-cover bg-gray-800"/>
                <div className="flex-1 min-w-0">
                  <div className={`truncate font-medium ${i === currentSongIndex ? 'text-blue-400' : 'text-white'}`}>{song.title}</div>
                  <div className="text-xs text-gray-400 truncate">{song.artist}</div>
                </div>
                {i === currentSongIndex && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* 底部控制 */}
        <div className="p-8 pb-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 mt-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold truncate pr-4">{currentSong.title}</h1>
            <p className="text-gray-400 truncate">{currentSong.artist}</p>
          </div>

          <div className="mb-6 group">
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
              <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
              <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button className="text-gray-400 hover:text-white"><Shuffle size={20}/></button>
            <button onClick={prevSong} className="text-white hover:scale-110 transition active:scale-95"><SkipBack size={32} fill="currentColor"/></button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)} 
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
            >
              {isPlaying ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor" className="ml-1"/>}
            </button>
            <button onClick={nextSong} className="text-white hover:scale-110 transition active:scale-95"><SkipForward size={32} fill="currentColor"/></button>
            <button className="text-gray-400 hover:text-white"><Repeat size={20}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
