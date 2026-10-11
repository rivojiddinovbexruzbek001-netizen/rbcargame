import React from 'react';
import { OnlineRoom } from '../types/game';
import { ArrowLeft, Users, Plus, Radio, Send, CheckCircle2, Trophy, Flame } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface OnlineModalProps {
  onJoinRoom: (room: OnlineRoom) => void;
  onClose: () => void;
}

const DEFAULT_ROOMS: OnlineRoom[] = [
  {
    id: 'room-1',
    name: 'Toshkent City Poygachilari',
    hostName: 'Jasur_Gentra',
    playersCount: 3,
    maxPlayers: 6,
    mode: 'Poyga (Race)',
    pingMs: 24,
  },
  {
    id: 'room-2',
    name: 'Chorsu Drift Arena',
    hostName: 'Sardor_Drifter',
    playersCount: 4,
    maxPlayers: 8,
    mode: 'Drift Challenge',
    pingMs: 18,
  },
  {
    id: 'room-3',
    name: 'M39 Katta Trassa Erkin Haydash',
    hostName: 'Bek_Cobalt',
    playersCount: 2,
    maxPlayers: 10,
    mode: 'Erkin Haydash',
    pingMs: 32,
  },
];

export const OnlineModal: React.FC<OnlineModalProps> = ({ onJoinRoom, onClose }) => {
  const [rooms, setRooms] = React.useState<OnlineRoom[]>(DEFAULT_ROOMS);
  const [selectedRoom, setSelectedRoom] = React.useState<OnlineRoom | null>(DEFAULT_ROOMS[0]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [newRoomName, setNewRoomName] = React.useState('');
  const [newRoomMode, setNewRoomMode] = React.useState('Erkin Haydash');

  // In-room chat state
  const [chatMessages, setChatMessages] = React.useState<Array<{ user: string; text: string; time: string }>>([
    { user: 'Jasur_Gentra', text: 'Salom barchaga! Gentra bilan kim poyga qiladi?', time: '20:12' },
    { user: 'Sardor_Drifter', text: 'Men tayyorman, start chizig‘iga o‘tinglar!', time: '20:13' },
    { user: 'Bek_Cobalt', text: 'Damas ham keldi, hozir qiziq bo‘ladi :)', time: '20:14' },
  ]);
  const [chatInput, setChatInput] = React.useState('');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    soundManager.playClick();
    const created: OnlineRoom = {
      id: `room-${Date.now()}`,
      name: newRoomName.trim(),
      hostName: 'Siz (O‘yinchi)',
      playersCount: 1,
      maxPlayers: 6,
      mode: newRoomMode,
      pingMs: 15,
    };
    setRooms([created, ...rooms]);
    setSelectedRoom(created);
    setIsCreating(false);
    setNewRoomName('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    soundManager.playClick();
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setChatMessages([...chatMessages, { user: 'Siz (O‘yinchi)', text: chatInput.trim(), time: timeStr }]);
    setChatInput('');
  };

  const handleEnterGame = () => {
    if (selectedRoom) {
      soundManager.playClick();
      onJoinRoom(selectedRoom);
    }
  };

  return (
    <div
      id="online-modal-overlay"
      className="absolute inset-0 select-none bg-neutral-950/75 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 z-30 pointer-events-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs uppercase tracking-wider text-sky-400 font-bold">MULTIPLAYER</span>
            <h2 className="font-racing text-2xl sm:text-3xl font-black text-white">ONLINE REJIM</h2>
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            setIsCreating(!isCreating);
          }}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-racing font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-sky-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>YANGI XONA YARATISH</span>
        </button>
      </div>

      {/* Center Layout: Rooms List & Room Lobby / Chat */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 my-auto">
        {/* Left column: Server / Room List */}
        <div className="lg:col-span-6 bg-neutral-950/90 border border-white/10 backdrop-blur-xl p-5 rounded-3xl shadow-2xl flex flex-col justify-between max-h-[60vh]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">FAOL XONALAR</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Server Online
              </span>
            </div>

            {/* Room creation panel */}
            {isCreating && (
              <form onSubmit={handleCreateRoom} className="mb-4 p-4 rounded-2xl bg-neutral-900 border border-sky-500/40">
                <div className="text-sm font-racing font-bold text-white mb-2">Yangi xona sozlamalari</div>
                <input
                  type="text"
                  placeholder="Xona nomi (Masalan: Toshkent Poyga)"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs mb-2 focus:outline-none focus:border-sky-400"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={newRoomMode}
                    onChange={(e) => setNewRoomMode(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-white/10 text-white text-xs focus:outline-none"
                  >
                    <option value="Erkin Haydash">Erkin Haydash</option>
                    <option value="Poyga (Race)">Poyga (Race)</option>
                    <option value="Drift Challenge">Drift Challenge</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-racing font-bold text-xs cursor-pointer"
                  >
                    Yaratish
                  </button>
                </div>
              </form>
            )}

            {/* Room cards */}
            <div className="space-y-2.5 overflow-y-auto max-h-[36vh] pr-1">
              {rooms.map((room) => {
                const active = selectedRoom?.id === room.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => {
                      soundManager.playClick();
                      setSelectedRoom(room);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? 'bg-sky-600/20 border-sky-400 shadow-lg shadow-sky-500/10'
                        : 'bg-neutral-900/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="font-racing font-bold text-sm sm:text-base text-white">{room.name}</div>
                      <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span>Rejim: {room.mode}</span>
                        <span>•</span>
                        <span>Host: {room.hostName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-racing text-xs font-bold text-sky-400 flex items-center justify-end gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {room.playersCount} / {room.maxPlayers}
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-semibold">{room.pingMs} ms</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Selected Room Details & Chat */}
        <div className="lg:col-span-6 bg-neutral-950/90 border border-white/10 backdrop-blur-xl p-5 rounded-3xl shadow-2xl flex flex-col justify-between max-h-[60vh]">
          {selectedRoom ? (
            <>
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="font-racing text-xl font-bold text-white">{selectedRoom.name}</h3>
                    <div className="text-xs text-sky-400 mt-0.5">Rejim: {selectedRoom.mode}</div>
                  </div>
                  <button
                    onClick={handleEnterGame}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-racing font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    XONAGA KIRISH
                  </button>
                </div>

                {/* Online Players inside room */}
                <div className="mt-3">
                  <div className="text-xs uppercase font-bold text-neutral-400 mb-1.5">O‘yinchilar:</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {selectedRoom.hostName} (Host)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-300 font-semibold border border-white/10">
                      Bek_Cobalt (Cobalt 1.5)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-300 font-semibold border border-white/10">
                      Sardor_Drifter (Damas)
                    </span>
                  </div>
                </div>

                {/* Live Room Chat */}
                <div className="mt-4">
                  <div className="text-xs uppercase font-bold text-neutral-400 mb-1.5">Xona Chati (O‘zbekcha):</div>
                  <div className="bg-neutral-900/90 rounded-2xl p-3 border border-white/10 h-36 overflow-y-auto space-y-2 text-xs">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-semibold">
                          <span className="text-sky-400">{msg.user}</span>
                          <span>•</span>
                          <span>{msg.time}</span>
                        </div>
                        <div className="text-neutral-200 mt-0.5">{msg.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat input form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                <input
                  type="text"
                  placeholder="Xabaringizni yozing..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center text-neutral-400 py-12">Xona tanlang</div>
          )}
        </div>
      </div>
    </div>
  );
};
