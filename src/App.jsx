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
  Upload // 新增图标
} from 'lucide-react';

// 默认内置的几首歌 (保留作为演示)
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
  // 把歌曲列表变成了 State，这样它是可以修改的
  const [songs, setSongs] = useState(INITIAL_SONGS);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null); // 新增：用于引用隐藏的文件输入框
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
  }, [isPlaying, currentSongIndex, songs]); // 监听 songs 变化

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

  // --- 新增：处理文件上传的核心逻辑 ---
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newSongs = files.map((file, index) => ({
      id: Date.now() + index, // 生成唯一ID
      title: file.name.replace(/\.[^/.]+$/, ""), // 去掉 .mp3 后缀作为歌名
      artist: "本地音乐", // 暂时无法读取歌手，统一显示本地音乐
      // 给本地音乐一个默认的酷炫封面
      cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop", 
      url: URL.createObjectURL(file), // 关键：把文件转换成浏览器能播放的 Blob URL
      color: "from-gray-700 to-gray-900" // 深色主题
    }));

    // 把新歌加到列表最后
    setSongs(prevSongs => [...prevSongs, ...newSongs]);
    // 自动播放刚刚导入的第一首歌
    setCurrentSongIndex(songs.length); 
    setIsPlaying(true);
    setShowPlaylist(true); // 打开播放列表让你看到
  };

  // 触发隐藏的文件选择框
  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };

  return (
    <div className={`min-h-screen w-full bg-gradient-to-br ${currentSong.color} bg-gray-900 text-white transition-colors duration-700 ease-in-out flex flex-col items-center justify-center font-sans overflow-hidden`}>
      <audio
        ref={audioRef}
        src={currentSong.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
      />

      {/* 隐藏的文件输入框 */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="audio/*" // 只允许选音频
        multiple // 允许选多个文件
        className="hidden" 
      />

      <div className="relative w-full max-w-md h-[90vh] md:h-auto md:aspect-[9/16] md:max-h-[800px] bg-black/30 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col">
        
        {/* 顶部栏 */}
        <div className="flex justify-between items-center p-6 z-10">
          <button 
            onClick={() => setShowPlaylist(!showPlaylist)} 
            className="p-2 rounded-full hover:bg-white/10 transition active:scale-95"
          >
            <ListMusic size={24} />
          </button>
          
          <div className="text-xs font-medium tracking-widest uppercase opacity-70">
            {currentSong.artist === "本地音乐" ? "Local Audio" : "Now Playing"}
          </div>
          
          {/* 新增：导入按钮 */}
          <button 
            onClick={triggerFileUpload}
            title="导入本地音乐"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition active:scale-95 border border-white/10"
          >
            <Upload size={20} />
          </button>
        </div>

        {/* 专辑封面区域 */}
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

        {/* 播放列表覆盖层 */}
        <div className={`absolute inset-0 bg-black/80 backdrop-blur-md z-20 transition-transform duration-300 transform ${showPlaylist ? 'translate-y-0' : 'translate-y-full'} flex flex-col`}>
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold">播放列表 ({songs.length})</h2>
            <div className="flex gap-2">
               <button 
                onClick={triggerFileUpload}
                className="px-3 py-1 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-500 flex items-center gap-1"
              >
                <Upload size={14}/> 导入
              </button>
              <button onClick={() => setShowPlaylist(false)} className="p-2 hover:bg-white/10 rounded-full">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
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
                  <p className="text-sm text-gray-400">{song.artist}</p>
                </div>
                {idx === currentSongIndex && (
                  <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 底部控制区域 */}
        <div className="p-6 pb-10 bg-gradient-to-t from-black/60 to-transparent z-10">
          <div className="flex justify-between items-end mb-6">
            <div className="overflow-hidden">
              <h1 className="text-2xl font-bold mb-1 tracking-tight truncate pr-4">{currentSong.title}</h1>
              <p className="text-gray-300 font-medium">{currentSong.artist}</p>
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

          <div className="flex items-center space-x-3 px-4 py-2 bg-white/5 rounded-xl backdrop-blur-sm">
            <button onClick={() => setIsMuted(!isMuted)}>
              {isMuted || volume === 0 ? <VolumeX size={20} className="text-gray-400"/> : <Volume2 size={20} className="text-gray-400"/>}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}