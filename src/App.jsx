import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Music,
  ListMusic,
  Heart,
  Shuffle,
  Repeat,
  Upload,
  Link as LinkIcon, // 引入链接图标
  Plus,
  X
} from 'lucide-react';

// 默认初始歌曲
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
    title: "Summer Breeze",
    artist: "Chill Lo-Fi",
    cover: "https://images.unsplash.com/photo-1459749411177-0473ef4884f3?q=80&w=500&auto=format&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "from-orange-500 to-yellow-500"
  }
];

export default function App() {
  const [songs, setSongs] = useState(INITIAL_SONGS);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  // 新增：控制添加链接弹窗的状态
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play().catch(e => {
        console.log("Audio play failed:", e);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSongIndex, songs]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  };

  const handleEnded = () => {
    nextSong();
  };

  const formatTime = (time) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextSong = () => {
    setCurrentSongIndex((prev) => (prev + 1) % songs.length);
    setIsPlaying(true);
  };

  const prevSong = () => {
    setCurrentSongIndex((prev) => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const selectSong = (index) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
    setShowPlaylist(false);
  };

  // --- 本地文件上传 ---
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newSongs = files.map((file, index) => ({
      id: Date.now() + index,
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

  // --- 新增：处理添加网络链接 ---
  const handleAddLink = () => {
    if (!newLinkUrl) return;

    const newSong = {
      id: Date.now(),
      title: newLinkTitle || "网络歌曲",
      artist: "网络/云盘",
      cover: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=500&auto=format&fit=crop",
      url: newLinkUrl,
      color: "from-indigo-600 to-blue-500"
    };

    setSongs(prev => [...prev, newSong]);
    setShowLinkModal(false);
    setNewLinkUrl("");
    setNewLinkTitle("");
    // 自动播放新歌
    setCurrentSongIndex(songs.length);
    setIsPlaying(true);
  };

  return (
    <div className={`min-h-screen w-full bg-gradient-to-br ${currentSong.color} bg-gray-900 text-white transition-colors duration-700 ease-in-out flex flex-col items-center justify-center font-sans overflow-hidden`}>
      <audio
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
        onError={() => alert("无法播放此链接，请检查链接是否有效或存在跨域限制。")}
      />

      {/* 隐藏的文件输入框 */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="audio/*" 
        multiple 
        className="hidden" 
      />

      {/* 添加网络链接的弹窗 (Modal) */}
      {showLinkModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-white/20 p-6 rounded-2xl w-full max-w-sm shadow-2xl transform transition-all scale-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">添加网络/云盘链接</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">歌曲标题</label>
                <input 
                  type="text" 
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="例如：周杰伦 - 稻香"
                  className="w-full bg-white/10 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">音频链接 (URL)</label>
                <input 
                  type="text" 
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="http://example.com/music.mp3"
                  className="w-full bg-white/10 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition"
                />
                <p className="text-xs text-gray-500 mt-2">支持网盘直链 (Alist)、MP3 链接</p>
              </div>
              
              <button 
                onClick={handleAddLink}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition mt-2 flex items-center justify-center gap-2"
              >
                <Plus size={20} /> 添加到列表
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主容器 */}
      <div className="relative w-full max-w-md h-[90vh] md:h-auto md:aspect-[9/16] md:max-h-[800px] bg-black/30 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col">
        
        {/* 顶部栏 */}
        <div className="flex justify-between items-center p-6 z-10">
          <button 
            onClick={() => setShowPlaylist(!showPlaylist)} 
            className="p-2 rounded-full hover:bg-white/10 transition active:scale-95"
          >
            <ListMusic size={24} />
          </button>
          
          <div className="text-xs font-medium tracking-widest uppercase opacity-70 truncate max-w-[150px]">
            {currentSong.artist}
          </div>
          
          <div className="flex gap-2">
            {/* 网络链接按钮 */}
            <button 
              onClick={() => setShowLinkModal(true)}
              title="添加网络链接"
              className="p-2 rounded-full bg-white/5 hover:bg-white/20 transition active:scale-95 border border-white/10"
            >
              <LinkIcon size={20} />
            </button>
            {/* 本地上传按钮 */}
            <button 
              onClick={() => fileInputRef.current.click()}
              title="上传本地音乐"
              className="p-2 rounded-full bg-white/5 hover:bg-white/20 transition active:scale-95 border border-white/10"
            >
              <Upload size={20} />
            </button>
          </div>
        </div>

        {/* 专辑封面 */}
        <div className={`relative flex-1 flex items-center justify-center p-8 transition-all duration-500 ${showPlaylist ? 'opacity-0 scale-90 hidden' : 'opacity-100 scale-100'}`}>
          <div className="relative w-64 h-64 md:w-72 md:h-72 group">
            <div className={`absolute inset-0 bg-gradient-to-tr ${currentSong.color} rounded-full blur-2xl opacity-60 animate-pulse`}></div>
            <img 
              src={currentSong.cover} 
              alt="Album Cover" 
              className={`relative w-full h-full object-cover rounded-3xl shadow-2xl transition-transform duration-700 ${isPlaying ? 'scale-100 rotate-0' : 'scale-95 rotate-1'}`}
            />
          </div>
        </div>

        {/* 播放列表 */}
        <div className={`absolute inset-0 bg-black/90 backdrop-blur-xl z-20 transition-transform duration-300 transform ${showPlaylist ? 'translate-y-0' : 'translate-y-full'} flex flex-col`}>
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold">播放列表 ({songs.length})</h2>
            <button onClick={() => setShowPlaylist(false)} className="p-2 hover:bg-white/10 rounded-full">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {songs.map((song, idx) => (
              <div 
                key={song.id} 
                onClick={() => selectSong(idx)}
                className={`flex items-center p-3 rounded-xl cursor-pointer transition ${idx === currentSongIndex ? 'bg-white/20' : 'hover:bg-white/5'}`}
              >
                <img src={song.cover} alt={song.title} className="w-12 h-12 rounded-lg object-cover mr-4" />
                <div className="flex-1 overflow-hidden">
                  <h3 className={`font-semibold truncate ${idx === currentSongIndex ? 'text-white' : 'text-gray-200'}`}>{song.title}</h3>
                  <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                </div>
                {idx === currentSongIndex && (
                  <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse flex-shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 底部控制 */}
        <div className="p-6 pb-10 bg-gradient-to-t from-black/80 to-transparent z-10">
          <div className="flex justify-between items-end mb-6">
            <div className="overflow-hidden pr-4">
              <h1 className="text-2xl font-bold mb-1 tracking-tight truncate">{currentSong.title}</h1>
              <p className="text-gray-300 font-medium truncate">{currentSong.artist}</p>
            </div>
            <button 
              onClick={() => setIsLiked(!isLiked)} 
              className={`p-2 rounded-full transition ${isLiked ? 'text-red-500' : 'text-white/70 hover:text-white'}`}
            >
              <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="mb-6 group">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
              style={{
                background: `linear-gradient(to right, white ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <button className="text-gray-400 hover:text-white transition">
              <Shuffle size={20} />
            </button>
            <button onClick={prevSong} className="text-white hover:text-gray-300 transition active:scale-90">
              <SkipBack size={32} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay} 
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-lg shadow-white/20 active:scale-95"
            >
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={nextSong} className="text-white hover:text-gray-300 transition active:scale-90">
              <SkipForward size={32} fill="currentColor" />
            </button>
            <button className="text-gray-400 hover:text-white transition">
              <Repeat size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}