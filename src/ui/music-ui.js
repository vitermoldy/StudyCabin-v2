import { formatDuration } from '../core/emitter.js';
import { thumbFor, LinkError } from '../music/links.js';
import { toast } from './panels.js';

const $ = (id) => document.getElementById(id);
const ICON = { YouTube: './icons/youtube.svg', 'YouTube Music': './icons/youtubemusic.svg' };

function svgUse(id) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', `#${id}`);
  svg.appendChild(use);
  return svg;
}

function setIcon(button, id) {
  const use = button.querySelector('use');
  if (use && use.getAttribute('href') !== `#${id}`) use.setAttribute('href', `#${id}`);
}

export function titleOf(item) {
  if (!item) return '';
  if (item.title) return item.title;
  return item.kind === 'playlist' ? 'YouTube playlist' : 'YouTube video';
}

export function mountMusic(player, panels, { onPlayingChange }) {
  const form = $('add-form');
  const input = $('link');
  const err = $('link-error');
  const state = $('player-state');
  const playBtn = $('playpause');
  const dockPlay = $('dock-play');
