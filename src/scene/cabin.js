import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { damp } from '../core/emitter.js';
import { FLOOR, CABIN, DECK, FURNITURE as F, ANNEX } from '../sim/layout.js';
import { weathered, std } from './materials.js';
import {
  sidingTexture, roofTexture, deckTexture, floorTexture, panelTexture,
  fabricTexture, printTexture, booksTexture, metricBoxUV,
