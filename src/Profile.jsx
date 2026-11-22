import React, { useState } from 'react';
import { BookOpen, ChevronRight, Heart, Settings, UserRound } from 'lucide-react';
import { readConnection } from './community-api';

export default function Profile({ favoriteCount, downloadCount }) {
  const [connection] = useState(readConnection);
  const username = connection?.session?.user?.username;
  return <section className="profile-page">
    <h1 tabIndex={-1}>我的</h1>
    <a href="#community/account" className={'profile-account' + (username ? ' is-signed-in' : '')}>
      {/* Decorative: the name is read from the text beside it. */}
      <span className="profile-avatar" aria-hidden="true">
        {username ? [...username.trim()][0] || '·' : <UserRound size={28} />}
      </span>
      <span><strong>{username || '账号与备份'}</strong>
        <small>{username ? '管理账号与配置备份' : '登录、注册与服务连接'}</small></span>
      <ChevronRight size={18} aria-hidden="true" />
    </a>
    <div className="profile-links">
      {[
        ['favorites', Heart, '收藏', `${favoriteCount} 道`],
        ['community/mine', BookOpen, '我的菜谱', `已下载 ${downloadCount} 道`],
        ['settings', Settings, '厨房设置', ''],
      ].map(([path, Icon, label, detail]) => <a key={path} href={'#' + path}>
        <Icon size={21} aria-hidden="true" /><strong>{label}</strong><small>{detail}</small>
        <ChevronRight size={17} aria-hidden="true" /></a>)}
    </div>
  </section>;
}
