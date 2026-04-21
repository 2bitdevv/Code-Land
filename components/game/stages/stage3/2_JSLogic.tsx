  'use client';
  import React, { useState, useRef, useEffect, useCallback } from 'react';
  import Swal from 'sweetalert2';
  import { LogicProgrammingGuide } from './file2_JSLogic';

  /* ════════════════════════════════════════════
    INJECTED CSS
  ════════════════════════════════════════════ */
  const INJECTED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Noto+Sans+Thai:wght@300;400;500;700&display=swap');
  @keyframes heartBeat{0%,100%{transform:scale(1)}10%{transform:scale(1.12)}20%{transform:scale(1)}30%{transform:scale(1.18)}40%{transform:scale(1)}}
  @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes badgePulse{0%,100%{box-shadow:0 0 10px var(--bc,#7F77DD)}50%{box-shadow:0 0 28px var(--bc,#7F77DD),0 0 50px var(--bc,#7F77DD)44}}
  @keyframes shimmer{0%{transform:translateX(-100%) rotate(45deg)}100%{transform:translateX(300%) rotate(45deg)}}
  @keyframes spinSlow{to{transform:rotate(360deg)}}
  @keyframes blink{0%,100%{opacity:.4}50%{opacity:1}}
  @keyframes orbiting{0%{transform:rotate(0deg) translateX(22px) rotate(0deg)}100%{transform:rotate(360deg) translateX(22px) rotate(-360deg)}}
  @keyframes scanline{0%{top:-10%}100%{top:110%}}
  @keyframes flicker{0%,100%{opacity:1}40%{opacity:.8}60%{opacity:.95}}
  @keyframes fireDance{0%,100%{transform:scaleY(1) scaleX(1)}25%{transform:scaleY(1.15) scaleX(.9)}75%{transform:scaleY(.9) scaleX(1.1)}}
  @keyframes radarSpin{to{transform:rotate(360deg)}}
  @keyframes slideBg{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes gemSpin{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}
  @keyframes crownGlow{0%,100%{filter:drop-shadow(0 0 6px #F5C518)}50%{filter:drop-shadow(0 0 20px #F5C518) drop-shadow(0 0 40px #D4A017)}}
  @keyframes orbitTag{0%{transform:translateX(-50%) rotate(0deg) translateX(36px) rotate(0deg)}100%{transform:translateX(-50%) rotate(360deg) translateX(36px) rotate(-360deg)}}
  `;

  /* ════ TYPE DEFINITIONS ════ */
  interface MapCoin{x:number;y:number;isKey?:boolean;isCrystal?:boolean;isTorch?:boolean;isFlask?:boolean;collected?:boolean}
  interface MapEnemy{x:number;y:number;hp:number;maxhp:number;boss:boolean;type:string;hitFlash?:number}
  interface MapDoor{x:number;y:number}
  interface MapGoal{x:number;y:number}
  interface LevelMap{coins:MapCoin[];enemy:MapEnemy|null;door:MapDoor|null;goal:MapGoal}
  interface Level{w:number;s:number;name:string;skill:string;boss:boolean;mission:string;hint:string;pal:string[];sol:string[];map:LevelMap;bossAtk?:number}
  interface World{name:string;skill:string;color:string;bg:string}
  interface Badge{id:string;name:string;desc:string;icon:string;colors:string[];threshold:number;stat:string}
  interface Char{id:string;name:string;price:number;hp:number;atk:number;shield:number;skillName:string;color:string;color2:string;desc:string;rarity:string;icon:string}
  interface MGQuestion{q:string;blocks:string[];ans:string[]}
  interface Particle{x:number;y:number;vx:number;vy:number;life:number;color:string;r:number}
  interface GameStep{t:string;tx?:number;ty?:number;ci?:number;ei?:number;msg?:string}
  interface GameState{
    gems:number;streak:number;hp:number;maxHp:number;claimed:boolean;
    hints:number;loggedIn:boolean;hintUsedThisStage:boolean;
    worldIdx:number;stageIdx:number;code:string[];running:boolean;
    particles:Particle[];t:number;
    worldProgress:number[][];
    selectedChar:string;ownedChars:string[];
    bp:Record<string,number>;
    mgIdx:number;mgSel:(string|null)[];mgAns:string[];mgScore:number;mgStreak:number;
    mgPlaysToday:number;mgLastResetDate:string;
    heartRegenTime:number|null;wrongAttempts:number;
  }

  /* ════ STATIC DATA ════ */
  const LEVELS:Level[]=[
    {w:0,s:0,name:'ทางแยกปริศนา',skill:'IF/ELSE',boss:false,mission:'ถ้าเส้นทางซ้ายปลอดภัยให้เลี้ยวซ้าย มิฉะนั้นให้เดินตรง จากนั้นเก็บ coin แล้วหยุด',hint:'ลำดับ: IF (เงื่อนไข) → ทำเมื่อจริง → ELSE → ทำเมื่อเท็จ → เก็บ coin → เดินตรง → หยุด',pal:['IF เส้นทางซ้ายปลอดภัย','เลี้ยวซ้าย','ELSE','เดินตรง','เก็บ coin','หยุด'],sol:['IF เส้นทางซ้ายปลอดภัย','เลี้ยวซ้าย','ELSE','เดินตรง','เก็บ coin','หยุด'],map:{coins:[{x:.42,y:.46},{x:.62,y:.46},{x:.82,y:.43}],enemy:null,door:null,goal:{x:.92,y:.43}}},
    {w:0,s:1,name:'สวนมอนสเตอร์',skill:'IF+LOOP',boss:false,mission:'ศัตรู HP 2! ถ้ายังมี HP ให้วน LOOP 2 ครั้ง โจมตีในแต่ละรอบ แล้วเก็บ coin เดินตรงไปข้างหน้าแล้วหยุด',hint:'IF ตรวจว่ามี HP → LOOP 2 ครั้ง (แต่ละรอบโจมตี) → เก็บ coin → เดินตรง → หยุด',pal:['IF ศัตรูมี HP','LOOP 2 ครั้ง','โจมตี','เก็บ coin','เดินตรง','หยุด'],sol:['IF ศัตรูมี HP','LOOP 2 ครั้ง','โจมตี','เก็บ coin','เดินตรง','หยุด'],map:{coins:[{x:.35,y:.5},{x:.6,y:.5}],enemy:{x:.68,y:.48,hp:2,maxhp:2,boss:false,type:'slime'},door:null,goal:{x:.9,y:.48}}},
    {w:0,s:2,name:'ห้องกุญแจลับ',skill:'Functions',boss:false,mission:'ประตูล็อก! เก็บกุญแจด้วย pickUpKey() แล้วเรียก unlockDoor() จากนั้นเดินตรงไป goal แล้วหยุด',hint:'ลำดับฟังก์ชัน: pickUpKey() ก่อน unlockDoor() เสมอ',pal:['pickUpKey()','unlockDoor()','เดินตรง','หยุด'],sol:['pickUpKey()','unlockDoor()','เดินตรง','หยุด'],map:{coins:[{x:.3,y:.5,isKey:true}],enemy:null,door:{x:.6,y:.5},goal:{x:.9,y:.48}}},
    {w:0,s:3,name:'BOSS: GLITCH',skill:'All Skills',boss:true,mission:'GLITCH จะโจมตี! เมื่อบอสโจมตีให้ shield() แล้ววน LOOP 4 ครั้งโจมตี เก็บ crystal แล้วหยุด',hint:'IF บอสโจมตี → shield() → LOOP 4 ครั้ง → โจมตี → เก็บ crystal → หยุด',pal:['IF GLITCH โจมตี','shield()','LOOP 4 ครั้ง','โจมตี','เก็บ crystal','หยุด'],sol:['IF GLITCH โจมตี','shield()','LOOP 4 ครั้ง','โจมตี','เก็บ crystal','หยุด'],map:{coins:[{x:.55,y:.42,isCrystal:true}],enemy:{x:.72,y:.45,hp:4,maxhp:4,boss:true,type:'glitch'},door:null,goal:{x:.9,y:.45}},bossAtk:1},
    {w:1,s:0,name:'ทุ่งหมอก',skill:'LOOP',boss:false,mission:'บนแผนที่มี gem 3 อัน — ใช้ LOOP 3 ครั้ง ในแต่ละรอบเก็บ gem หนึ่งอัน แล้วหยุดที่จุดหมาย',hint:'LOOP 3 ครั้ง → เก็บ gem (ทำซ้ำในลูป) → หยุด',pal:['LOOP 3 ครั้ง','เก็บ gem','เดินตรง','หยุด'],sol:['LOOP 3 ครั้ง','เก็บ gem','หยุด'],map:{coins:[{x:.35,y:.48},{x:.55,y:.48},{x:.75,y:.48}],enemy:null,door:null,goal:{x:.88,y:.48}}},
    {w:1,s:1,name:'ป่าหนาม',skill:'LOOP+COND',boss:false,mission:'ศัตรูป่า HP 3! วน LOOP 3 ครั้ง — ในแต่ละรอบถ้าศัตรูยังมี HP ให้โจมตี พอครบลูปให้เดินตรงแล้วหยุด',hint:'LOOP 3 ครั้ง → IF ศัตรูมี HP → โจมตี (ทำในแต่ละรอบ) → เดินตรง → หยุด',pal:['LOOP 3 ครั้ง','IF ศัตรูมี HP','โจมตี','เดินตรง','หยุด'],sol:['LOOP 3 ครั้ง','IF ศัตรูมี HP','โจมตี','เดินตรง','หยุด'],map:{coins:[],enemy:{x:.65,y:.5,hp:3,maxhp:3,boss:false,type:'goblin'},door:null,goal:{x:.9,y:.5}}},
    {w:1,s:2,name:'ถ้ำมืด',skill:'Variables',boss:false,mission:'ตั้งค่าตัวแปร speed=2 ด้วย setVar แล้วใช้ LOOP speed ครั้งเพื่อสำรวจ — ในแต่ละรอบเก็บ torch หนึ่งอัน แล้วหยุด',hint:'setVar speed=2 → LOOP speed → เก็บ torch (แต่ละรอบของลูป) → หยุด',pal:['setVar speed=2','LOOP speed','เก็บ torch','หยุด'],sol:['setVar speed=2','LOOP speed','เก็บ torch','หยุด'],map:{coins:[{x:.4,y:.5,isTorch:true},{x:.65,y:.5,isTorch:true}],enemy:null,door:null,goal:{x:.88,y:.5}}},
    {w:1,s:3,name:'BOSS: SHADOW',skill:'LOOP+VAR',boss:true,mission:'SHADOW HP 6! ตั้ง power=2 แล้ววน LOOP 6 ครั้ง — แต่ละรอบโจมตีด้วยพลัง power จากนั้นเก็บ crystal แล้วหยุด',hint:'setVar power=2 → LOOP 6 ครั้ง → โจมตี power → เก็บ crystal → หยุด',pal:['setVar power=2','LOOP 6 ครั้ง','โจมตี power','เก็บ crystal','หยุด'],sol:['setVar power=2','LOOP 6 ครั้ง','โจมตี power','เก็บ crystal','หยุด'],map:{coins:[{x:.5,y:.43,isCrystal:true}],enemy:{x:.72,y:.45,hp:6,maxhp:6,boss:true,type:'shadow'},door:null,goal:{x:.9,y:.45}},bossAtk:1},
    {w:2,s:0,name:'โรงงานเวทย์',skill:'Function Def',boss:false,mission:'นิยามฟังก์ชันกระโดดด้วย define jump() แล้วเรียกใช้ call jump() สองครั้ง (เทียบกับกระโดดข้ามสองช่วง) แล้วหยุด',hint:'นิยามก่อนเรียกใช้: define jump() → call jump() → call jump() → หยุด',pal:['define jump()','call jump()','เดินตรง','หยุด'],sol:['define jump()','call jump()','call jump()','หยุด'],map:{coins:[{x:.45,y:.5},{x:.7,y:.5}],enemy:null,door:null,goal:{x:.9,y:.5}}},
    {w:2,s:1,name:'ห้องทดลอง',skill:'Return',boss:false,mission:'เรียก calcDamage() เพื่อได้ค่าความเสียหาย แล้วส่งต่อให้ applyDamage() นำไปใช้ จากนั้นเก็บ flask แล้วหยุด',hint:'ลำดับ: คำนวณก่อน → นำไปใช้: calcDamage() → applyDamage() → เก็บ flask → หยุด',pal:['calcDamage()','applyDamage()','เก็บ flask','หยุด'],sol:['calcDamage()','applyDamage()','เก็บ flask','หยุด'],map:{coins:[{x:.55,y:.5,isFlask:true}],enemy:null,door:null,goal:{x:.88,y:.5}}},
    {w:2,s:2,name:'ประตูคู่ขนาน',skill:'Nested Func',boss:false,mission:'ด่านนี้สอน “ทำงานเป็นขั้น ๆ”: ก่อนเข้าห้องลับต้องเปิดเส้นทางก่อน — เรียก openPath() เพื่อปลดล็อกทาง แล้ว enterRoom() เพื่อเข้าไปในห้องถัดไป จากนั้นหยุดเมื่อถึงจุดหมาย',hint:'ทำทีละขั้น: openPath() → enterRoom() → หยุด',pal:['openPath()','enterRoom()','เดินตรง','หยุด'],sol:['openPath()','enterRoom()','หยุด'],map:{coins:[],enemy:null,door:{x:.55,y:.5},goal:{x:.9,y:.5}}},
    {w:2,s:3,name:'BOSS: VIRUS',skill:'Functions ALL',boss:true,mission:'VIRUS HP 8! ฟื้นฟูระบบ restoreFunc() แล้ว shield() จากนั้นวน LOOP 8 ครั้งโจมตี เก็บ crystal แล้วหยุด (บอสโจมตีแรง — ระวัง HP)',hint:'restoreFunc() → shield() → LOOP 8 ครั้ง → โจมตี → เก็บ crystal → หยุด',pal:['restoreFunc()','shield()','LOOP 8 ครั้ง','โจมตี','เก็บ crystal','หยุด'],sol:['restoreFunc()','shield()','LOOP 8 ครั้ง','โจมตี','เก็บ crystal','หยุด'],map:{coins:[{x:.5,y:.43,isCrystal:true}],enemy:{x:.72,y:.45,hp:8,maxhp:8,boss:true,type:'virus'},door:null,goal:{x:.9,y:.45}},bossAtk:2},
    {w:3,s:0,name:'สถานีอวกาศ',skill:'Debug',boss:false,mission:'ระบบสถานีรายงานว่าโค้ดทำงานผิดปกติ — ให้แก้แบบเป็นขั้นตอน: ค้นหาจุดผิดด้วย findBug() แล้วแก้ด้วย fixBug() จากนั้นเดินตรงไปยังแผนกควบคุมแล้วหยุด',hint:'findBug() → fixBug() → เดินตรง → หยุด',pal:['findBug()','fixBug()','เดินตรง','หยุด'],sol:['findBug()','fixBug()','เดินตรง','หยุด'],map:{coins:[{x:.5,y:.5},{x:.7,y:.5}],enemy:null,door:null,goal:{x:.9,y:.5}}},
    {w:3,s:1,name:'ดาวเคราะห์น้อย',skill:'Try/Catch',boss:false,mission:'ยานสำรวจเจอเหตุการณ์ที่อาจล้มเหลวได้ — ถ้าตรวจพบว่ามีความเสี่ยง (IF พบข้อผิดพลาด) ให้ใช้ try() ลองทำงาน หากมีปัญหาให้ catch() รับมือ และ finally() ปิดท้ายขั้นตอนเสมอ แล้วหยุด',hint:'IF พบข้อผิดพลาด → try() → catch() → finally() → หยุด',pal:['IF พบข้อผิดพลาด','try()','catch()','finally()','หยุด'],sol:['IF พบข้อผิดพลาด','try()','catch()','finally()','หยุด'],map:{coins:[{x:.45,y:.5},{x:.65,y:.5}],enemy:null,door:null,goal:{x:.88,y:.5}}},
    {w:3,s:2,name:'หลุมดำ',skill:'Recursion',boss:false,mission:'แรงโน้มถ่วงดึงปัญหาเข้าไปซ้ำ ๆ — การแก้แบบ recursion ต้องมี “ฐานหยุด”: กำหนด setBase n=0 แล้วเรียกแก้ปัญหาย่อยด้วย call solve(n) จนลงเอยที่ baseCase แล้วหยุด',hint:'setBase n=0 → call solve(n) → baseCase → หยุด',pal:['setBase n=0','call solve(n)','baseCase','หยุด'],sol:['setBase n=0','call solve(n)','baseCase','หยุด'],map:{coins:[{x:.4,y:.5},{x:.6,y:.5},{x:.78,y:.5}],enemy:null,door:null,goal:{x:.9,y:.5}}},
    {w:3,s:3,name:'BOSS: BLACKOUT',skill:'Debug ALL',boss:true,mission:'BLACKOUT HP 10! บันทึกข้อผิดพลาด logError() แล้ว shield() จากนั้นวน LOOP 10 ครั้งโจมตี เก็บ crystal แล้วหยุด (บอสโจมตีแรง)',hint:'logError() → shield() → LOOP 10 ครั้ง → โจมตี → เก็บ crystal → หยุด',pal:['logError()','shield()','LOOP 10 ครั้ง','โจมตี','เก็บ crystal','หยุด'],sol:['logError()','shield()','LOOP 10 ครั้ง','โจมตี','เก็บ crystal','หยุด'],map:{coins:[{x:.5,y:.43,isCrystal:true}],enemy:{x:.72,y:.45,hp:10,maxhp:10,boss:true,type:'blackout'},door:null,goal:{x:.9,y:.45}},bossAtk:2},
    {w:4,s:0,name:'ปราสาทสุดท้าย',skill:'Algorithm',boss:false,mission:'ใช้ binarySearch() ค้นหาตำแหน่งกุญแจในเขตข้อมูล แล้ว unlock() เปิดประตู เดินตรงไป goal แล้วหยุด (ในเกมนี้ค้นหาและปลดล็อกเป็นบล็อกต่อเนื่อง)',hint:'binarySearch() → unlock() → เดินตรง → หยุด',pal:['binarySearch()','unlock()','เดินตรง','หยุด'],sol:['binarySearch()','unlock()','เดินตรง','หยุด'],map:{coins:[{x:.4,y:.5},{x:.65,y:.5,isKey:true}],enemy:null,door:{x:.7,y:.5},goal:{x:.9,y:.5}}},
    {w:4,s:1,name:'หอคอยปริศนา',skill:'Sort',boss:false,mission:'หอคอยเก็บแผ่นข้อมูลสลับลำดับ — ต้องเรียงให้ถูกก่อนปลดรหัส: ใช้ bubbleSort() จัดเรียงจากคู่ข้างกันไปเรื่อย ๆ แล้ว verify() ตรวจว่าลำดับถูกต้อง จากนั้นหยุดเมื่อผ่านการตรวจ',hint:'bubbleSort() → verify() → หยุด',pal:['bubbleSort()','verify()','หยุด'],sol:['bubbleSort()','verify()','หยุด'],map:{coins:[{x:.4,y:.5},{x:.6,y:.5},{x:.78,y:.5}],enemy:null,door:null,goal:{x:.9,y:.5}}},
    {w:4,s:2,name:'ห้องสมบัติ',skill:'Graph/DFS',boss:false,mission:'ห้องสมบัติเชื่อมหลายห้องเป็นกราฟ — ต้องสำรวจให้ครบก่อนเก็บของ: ใช้ DFS() เดินสำรวจลึกเข้าไปในโครงสร้างทาง แล้ว collectAll() รวบรวมสมบัติที่พบ จากนั้นหยุดที่ทางออก',hint:'DFS() → collectAll() → หยุด',pal:['DFS()','collectAll()','หยุด'],sol:['DFS()','collectAll()','หยุด'],map:{coins:[{x:.35,y:.5},{x:.5,y:.5},{x:.65,y:.5},{x:.78,y:.5}],enemy:null,door:null,goal:{x:.9,y:.5}}},
    {w:4,s:3,name:'GLITCH PRIME',skill:'ALL SKILLS',boss:true,mission:'FINAL BOSS HP 12! วิเคราะห์ analyze() แล้ว shield() จากนั้นวน LOOP 12 ครั้งโจมตีด้วยพลังสูงสุด เก็บ crystal แล้วหยุด (บอสโจมตีหนักมาก)',hint:'analyze() → shield() → LOOP 12 ครั้ง → โจมตี MAX → เก็บ crystal → หยุด',pal:['analyze()','shield()','LOOP 12 ครั้ง','โจมตี MAX','เก็บ crystal','หยุด'],sol:['analyze()','shield()','LOOP 12 ครั้ง','โจมตี MAX','เก็บ crystal','หยุด'],map:{coins:[{x:.5,y:.4,isCrystal:true}],enemy:{x:.72,y:.44,hp:12,maxhp:12,boss:true,type:'prime'},door:null,goal:{x:.9,y:.44}},bossAtk:3},
  ];

  const WORLDS:World[]=[
    {name:'World 1: เมืองอาหาร',skill:'IF / ELSE',color:'#7F77DD',bg:'city'},
    {name:'World 2: ป่าลึกลับ',skill:'Loops & Variables',color:'#1D9E75',bg:'forest'},
    {name:'World 3: โรงงานเวทย์',skill:'Functions',color:'#BA7517',bg:'factory'},
    {name:'World 4: อวกาศ Debug',skill:'Debug & Recursion',color:'#378ADD',bg:'space'},
    {name:'World 5: ปราสาทสุดท้าย',skill:'Algorithms',color:'#D85A30',bg:'castle'},
  ];

  const BADGES:Badge[]=[
    {id:'ifm',name:'IF Master',desc:'ใช้ IF ครบ 10 ครั้ง',icon:'🧠',colors:['#7F77DD','rgba(127,119,221,.18)','rgba(127,119,221,.5)'],threshold:10,stat:'ifm'},
    {id:'loop',name:'Loop Hero',desc:'วน Loop รวม 20 รอบ',icon:'🔄',colors:['#1D9E75','rgba(29,158,117,.18)','rgba(29,158,117,.5)'],threshold:20,stat:'loop'},
    {id:'bug',name:'Bug Hunter',desc:'ชนะ boss 5 ตัว',icon:'🐛',colors:['#D85A30','rgba(216,90,48,.18)','rgba(216,90,48,.5)'],threshold:5,stat:'bug'},
    {id:'speed',name:'Speed Coder',desc:'ได้ 3 ดาว 5 ด่าน',icon:'⚡',colors:['#F5C518','rgba(245,197,24,.18)','rgba(245,197,24,.5)'],threshold:5,stat:'speed'},
    {id:'streak7',name:'On Fire!',desc:'เล่นครบ 7 วัน streak',icon:'🔥',colors:['#E24B4A','rgba(226,75,74,.18)','rgba(226,75,74,.5)'],threshold:7,stat:'streak7'},
    {id:'perf',name:'Perfectionist',desc:'3 ดาว 8 ด่าน',icon:'⭐',colors:['#F5C518','rgba(245,197,24,.14)','rgba(245,197,24,.45)'],threshold:8,stat:'perf'},
    {id:'boss',name:'Boss Slayer',desc:'ชนะ boss 3 ตัว',icon:'👑',colors:['#D85A30','rgba(216,90,48,.18)','rgba(216,90,48,.5)'],threshold:3,stat:'bug'},
    {id:'gem',name:'Gem Hoarder',desc:'สะสม 500 Gems',icon:'💎',colors:['#AFA9EC','rgba(174,169,236,.18)','rgba(174,169,236,.5)'],threshold:500,stat:'ifm'},
  ];

  const CHARS:Char[]=[
    {id:'free',name:'Byte Classic',price:0,hp:3,atk:1,shield:0,skillName:'—',color:'#7F77DD',color2:'#534AB7',desc:'ตัวละครเริ่มต้น เรียบง่ายแต่เชื่อถือได้',rarity:'free',icon:'🤖'},
    {id:'scout',name:'Scout Bot',price:80,hp:4,atk:2,shield:0,skillName:'Sprint',color:'#1D9E75',color2:'#0F6E56',desc:'เร็วว่องไว ',rarity:'common',icon:'⚡'},
    {id:'guardian',name:'Guardian X',price:180,hp:5,atk:2,shield:1,skillName:'Block 1 Atk',color:'#378ADD',color2:'#185FA5',desc:'เกราะหนาแน่น ป้องกัน 1 ครั้ง เหมาะสู้บอส',rarity:'rare',icon:'🛡️'},
    {id:'pyro',name:'Pyro-Bot',price:250,hp:4,atk:4,shield:0,skillName:'Burn ×2',color:'#D85A30',color2:'#712B13',desc:'ร่างกายลุกเป็นไฟ ATK สูงสุด',rarity:'rare',icon:'🔥'},
    {id:'sage',name:'Sage AI',price:400,hp:6,atk:3,shield:1,skillName:'Auto-Hint',color:'#D4537E',color2:'#993556',desc:'พ่อมด สายสมดุลมีป้องกัน 1ครั้ง',rarity:'epic',icon:'🧬'},
    {id:'titan',name:'TITAN CORE',price:700,hp:10,atk:4,shield:2,skillName:'Immortal',color:'#F5C518',color2:'#D4A017',desc:'ตัวละครสูงสุด มงกุฎทอง อมตะ 1 ราวน์',rarity:'legendary',icon:'👑'},
  ];

  const MG_Q:MGQuestion[]=[
    {q:'โปรแกรม: "ถ้าเปิด → เดิน → หยุด" เรียง block ให้ถูก',blocks:['เดินตรง','IF ประตูเปิด','หยุด'],ans:['IF ประตูเปิด','เดินตรง','หยุด']},
    {q:'โปรแกรม: "วน 3 ครั้ง → เก็บ → หยุด" เรียง block ให้ถูก',blocks:['หยุด','เก็บ coin','LOOP 3 ครั้ง'],ans:['LOOP 3 ครั้ง','เก็บ coin','หยุด']},
    {q:'โปรแกรม: "ถ้า HP → โจมตี → ELSE → หนี" เรียง block',blocks:['ELSE','IF ศัตรูมี HP','โจมตี','หนี'],ans:['IF ศัตรูมี HP','โจมตี','ELSE','หนี']},
    {q:'โปรแกรม: "รับกุญแจ → เปิดประตู → หยุด"',blocks:['หยุด','unlockDoor()','pickUpKey()'],ans:['pickUpKey()','unlockDoor()','หยุด']},
    {q:'โปรแกรม: "วน 5 ครั้ง → โจมตี → เดิน → หยุด"',blocks:['เดินตรง','LOOP 5 ครั้ง','หยุด','โจมตี'],ans:['LOOP 5 ครั้ง','โจมตี','เดินตรง','หยุด']},
    {q:'โปรแกรม: "กำหนด x=3 → ถ้า x>0 → พิมพ์ YES → หยุด"',blocks:['IF x>0','หยุด','setVar x=3','พิมพ์ YES'],ans:['setVar x=3','IF x>0','พิมพ์ YES','หยุด']},
  ];

  const DREW=[{l:'10G',icon:'⭐',v:10},{l:'15G',icon:'⭐',v:15},{l:'1 Hint',icon:'💡',v:1},{l:'20G',icon:'⭐',v:20},{l:'2 Hint',icon:'💡',v:2},{l:'75G',icon:'⭐',v:75},{l:'150G',icon:'🎁',v:150}];
  const RARITY:Record<string,string>={free:'FREE',common:'COMMON',rare:'RARE',epic:'EPIC',legendary:'LEGENDARY'}; 
  const RCOL:Record<string,string>={free:'#888780',common:'#1D9E75',rare:'#7F77DD',epic:'#D4537E',legendary:'#F5C518'};
  const SAVE_KEY='jslogic_stage3_2_save_v2';
  const REWARD_BY_STARS=[0,8,14,20] as const;
  const BOSS_BONUS_BY_STARS=[0,20,35,50] as const;

  /* ════ HELPERS ════ */
  function lighten(hex:string,amt:number):string{
    const r=Math.min(255,parseInt(hex.slice(1,3),16)+Math.round(amt*255));
    const g=Math.min(255,parseInt(hex.slice(3,5),16)+Math.round(amt*255));
    const b=Math.min(255,parseInt(hex.slice(5,7),16)+Math.round(amt*255));
    return '#'+('0'+r.toString(16)).slice(-2)+('0'+g.toString(16)).slice(-2)+('0'+b.toString(16)).slice(-2);
  }
  function hexToRgba(hex:string,alpha:number):string{
    if(hex.startsWith('var('))return'rgba(127,119,221,'+alpha+')';
    const r=parseInt(hex.slice(1,3),16)||128,g=parseInt(hex.slice(3,5),16)||128,b=parseInt(hex.slice(5,7),16)||128;
    return'rgba('+r+','+g+','+b+','+alpha+')';
  }

  const BCMAP:Record<string,string>={
    'IF':'bif','ELSE':'belse','LOOP':'bloop','เดิน':'bmove','เลี้ยว':'bmove','หยุด':'bstop',
    'เก็บ':'bact','โจมตี':'bif','pick':'bact','unlock':'bact','shield':'bshield',
    'define':'bdef','call':'bdef','set':'bloop','find':'bact','fix':'bact','try':'bact',
    'catch':'bact','finally':'bact','base':'bloop','restore':'bdef','log':'bact',
    'binary':'bact','bubble':'bact','DFS':'bact','calc':'bdef','apply':'bdef',
    'open':'bact','enter':'bact','analyze':'bdef','verify':'bact',
  };
  const BLK_COLORS:Record<string,{bg:string;text:string;border:string}>={
    bif:{bg:'rgba(38,33,92,.9)',text:'#CECBF6',border:'#534AB7'},
    belse:{bg:'rgba(38,33,92,.6)',text:'#AFA9EC',border:'#3C3489'},
    bloop:{bg:'rgba(4,52,44,.9)',text:'#9FE1CB',border:'#0F6E56'},
    bmove:{bg:'rgba(4,44,83,.9)',text:'#B5D4F4',border:'#185FA5'},
    bact:{bg:'rgba(65,36,2,.9)',text:'#FAC775',border:'#854F0B'},
    bstop:{bg:'rgba(61,16,16,.9)',text:'#F7C1C1',border:'#791F1F'},
    bshield:{bg:'rgba(4,44,83,.7)',text:'#85B7EB',border:'#378ADD'},
    bdef:{bg:'rgba(75,21,40,.8)',text:'#F4C0D1',border:'#993556'},
  };
  function getBlkCls(b:string):string{
    let cls='bdef';const bl=b.toLowerCase();
    for(const k of Object.keys(BCMAP)){if(bl.startsWith(k.toLowerCase())){cls=BCMAP[k];break;}}
    return cls;
  }
  function getBlkStyle(cls:string):React.CSSProperties{
    const c=BLK_COLORS[cls]||BLK_COLORS.bdef;
    return{background:c.bg,color:c.text,borderColor:c.border,borderWidth:1,borderStyle:'solid'};
  }

  /** คำอธิบายทีละบล็อกหลังผ่านด่าน — ให้สอดคล้องกับเครื่องยนต์เกม (เดิน/เก็บ/โจมตี/บอส) */
  interface CodeStepExplain{code:string;explain:string}
  function explainSolutionBlock(b:string):string{
    const t=b.trim();
    if(t.startsWith('IF '))return'ตรวจเงื่อนไข “'+t.slice(3)+'” — ถ้าเป็นจริง เกมจะดำเนินตามลำดับบล็อกถัดไปในสาขา “จริง” (เหมือน if ในโค้ดจริง)';
    if(t==='ELSE')return'ถ้าเงื่อนไข IF ก่อนหน้าเป็นเท็จ — เกมใช้สาขานี้แทน (else)';
    const loopNum=t.match(/^LOOP\s+(\d+)/);
    if(loopNum)return'วนซ้ำ '+loopNum[1]+' รอบ — บล็อกถัดไปที่เป็นการกระทำ (เช่น โจมตี/เก็บ) จะถูกนับร่วมกับลูปตามกติกาเกมนี้ (จำนวนครั้ง × การโจมตี)';
    if(t==='LOOP speed')return'วนตามจำนวนรอบที่ตั้งในตัวแปร speed — แสดงให้เห็นการใช้ตัวแปรกับ LOOP';
    if(t.includes('โจมตี'))return'สั่งโจมตี — ลด HP ของศัตรู/บอสบนแผนที่ (ดาเมจขึ้นกับ ATK ของตัวละคร)';
    if(t.includes('shield()'))return'เปิดโล่ — ลดหรือหลีกเลี่ยงความเสียหายจากการโจมตีของบอสในขั้นตอนพิเศษ';
    if(t.includes('เลี้ยว'))return'เลี้ยวตามทิศที่ Mission กำหนด — เปลี่ยนเส้นทางของตัวละคร';
    if(t==='เดินตรง')return'เดินไปข้างหน้า — เลื่อนตัวละครตามเส้นทางไปยังจุดถัดไปหรือจุดหมาย';
    if(t==='หยุด')return'จบโปรแกรม — หยุดการทำงานและปิดด่านเมื่อขั้นตอนอื่นครบแล้ว';
    if(t.includes('pickUpKey'))return'เก็บกุญแจบนแผนที่ — ต้องทำก่อนปลดล็อกประตู';
    if(t.includes('unlockDoor'))return'เรียกฟังก์ชันปลดล็อกประตู — เปิดประตูบนแผนที่ให้เดินผ่านได้';
    if(t.includes('binarySearch'))return'จำลองการค้นหาแบบแบ่งครึ่ง — ในเกมคือขั้นตอนหาตำแหน่ง/ข้อมูลก่อนปลดล็อก';
    if(t.includes('unlock()')&&!t.includes('Door'))return'ปลดล็อกกลไกหรือประตู — เปิดทางไปยังจุดหมายหลังค้นหาเจอ';
    if(t.includes('bubbleSort'))return'จำลองการเรียงลำดับข้อมูล — ขั้นตอนเตรียมก่อนตรวจสอบความถูกต้อง';
    if(t.includes('verify()'))return'ตรวจสอบผลหลังเรียง — ยืนยันว่าลำดับข้อมูลถูกต้องตามเงื่อนไขด่าน';
    if(t.includes('DFS()'))return'จำลองการสำรวจแบบลึก (Depth-First) — เดินสำรวจโครงสร้างก่อนรวบรวมของ';
    if(t.includes('collectAll()'))return'รวบรวมของที่สำรวจได้ — เก็บสมบัติบนแผนที่ครบตามด่าน';
    if(t.startsWith('define '))return'ประกาศฟังก์ชัน — นิยามชื่อและพฤติกรรมก่อนเรียกใช้ด้วย call';
    if(t.startsWith('call '))return'เรียกใช้ฟังก์ชันที่นิยามไว้ — รันพฤติกรรมของฟังก์ชันนั้น (เช่น กระโดดข้ามช่วง)';
    if(t.includes('setVar'))return'กำหนดค่าตัวแปร — ใช้ค่านี้กับ LOOP หรือคำสั่งถัดไป (เช่น speed, power)';
    if(t.includes('calcDamage'))return'คำนวณค่าความเสียหาย — ขั้นตอน “ส่งค่า” ไปให้ฟังก์ชันถัดไป';
    if(t.includes('applyDamage'))return'นำค่าที่คำนวณแล้วไปใช้ — ลงมือทำดาเมจหรือผลลัพธ์ในเกม';
    if(t.includes('findBug'))return'ค้นหาจุดผิดพลาดในโค้ด — ขั้นตอนแรกของการดีบัก';
    if(t.includes('fixBug'))return'แก้ไขบั๊กที่พบ — หลังแก้แล้วจึงเดินต่อได้ตามปกติ';
    if(t.includes('try()'))return'ลองรันส่วนที่อาจผิดพลาด — เริ่มบล็อก try/catch/finally';
    if(t.includes('catch()'))return'จัดการเมื่อเกิดข้อผิดพลาด — รับและจัดการข้อยกเว้น';
    if(t.includes('finally()'))return'ทำเสมอหลัง try/catch — ปิดท้ายขั้นตอนไม่ว่าผลจะเป็นอย่างไร';
    if(t.includes('setBase')||t.includes('baseCase')||t.includes('call solve'))return'จำลอง recursion — กำหนดฐานหยุด เรียกแก้ปัญหาแบบแบ่งเล็กลง แล้วจบที่ base case';
    if(t.includes('restoreFunc'))return'ฟื้นฟู/กู้คืนฟังก์ชัน — ขั้นตอนเตรียมก่อนสู้บอสในเนื้อเรื่องด่าน';
    if(t.includes('logError'))return'บันทึกข้อผิดพลาด — ช่วยวินิจฉัยก่อนรับมือกับบอส';
    if(t.includes('analyze()'))return'วิเคราะห์สถานการณ์ — ขั้นตอนเปิดด่านบอสสุดท้ายก่อนใช้โล่และโจมตี';
    if(t.includes('openPath'))return'เปิดเส้นทาง — ปลดล็อกทางเข้าห้องถัดไป';
    if(t.includes('enterRoom'))return'เข้าห้องถัดไป — เคลื่อนที่เข้าสู่พื้นที่ใหม่บนแผนที่';
    if(t.includes('เก็บ'))return'เก็บของบนแผนที่ — coin / gem / torch / flask / crystal ตามจุดที่แตะ';
    return'คำสั่งพิเศษตามด่าน — ดำเนินเหตุการณ์ในเกมให้สอดคล้องกับ Mission';
  }
  function getSolutionWalkthrough(lv:Level):CodeStepExplain[]{
    return lv.sol.map(code=>({code,explain:explainSolutionBlock(code)}));
  }

  /* ════ BG STARS ════ */
  const bgStarsInit:{x:number;y:number;r:number;ph:number}[]=[];
  for(let i=0;i<70;i++)bgStarsInit.push({x:Math.random(),y:Math.random()*.65,r:Math.random()*1.4+.2,ph:Math.random()*Math.PI*2});

  /* ════════════════════════════════════
    CANVAS DRAW FUNCTIONS (all inline)
  ════════════════════════════════════ */
  function drawRR(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){
    if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
    else{ctx.beginPath();ctx.rect(x,y,w,h);}
  }

  /* backgrounds */
  function drawCityBg(ctx:CanvasRenderingContext2D,W:number,H:number,t:number){
    ctx.fillStyle='#0a0a22';ctx.fillRect(0,0,W,H);
    bgStarsInit.forEach(s=>{const a=.2+.8*Math.abs(Math.sin(t*.005+s.ph));ctx.beginPath();ctx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,'+a.toFixed(2)+')';ctx.fill();});
    ctx.fillStyle='#ccc8e8';ctx.beginPath();ctx.arc(W*.86,H*.15,16,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#0a0a22';ctx.beginPath();ctx.arc(W*.86-5,H*.15-3,12,0,Math.PI*2);ctx.fill();
    const gY=H*.54;
    [{x:.08,w:50,h:80},{x:.2,w:36,h:55},{x:.35,w:60,h:90},{x:.52,w:40,h:65},{x:.66,w:55,h:75},{x:.8,w:38,h:50}].forEach(b=>{
      const bx=b.x*W,bh=b.h*(H/200);ctx.fillStyle='#121230';ctx.fillRect(bx,gY-bh,b.w,bh);
      for(let wy=gY-bh+6;wy<gY-6;wy+=10)for(let wx=bx+4;wx<bx+b.w-4;wx+=10){const won=Math.sin(wy*wx)>.3;ctx.fillStyle=won?'rgba(255,230,100,.6)':'rgba(255,255,255,.05)';ctx.fillRect(wx,wy,5,6);}
    });
    ctx.fillStyle='#1a3009';ctx.fillRect(0,gY,W,H-gY);
    ctx.fillStyle='#2d5016';ctx.fillRect(0,gY,W,5);
    ctx.fillStyle='#3d2008';ctx.fillRect(0,gY+5,W,H-gY-5);
  }
  function drawForestBg(ctx:CanvasRenderingContext2D,W:number,H:number,t:number){
    ctx.fillStyle='#0a1a08';ctx.fillRect(0,0,W,H);
    bgStarsInit.forEach(s=>{const a=.1+.3*Math.abs(Math.sin(t*.004+s.ph));ctx.beginPath();ctx.arc(s.x*W,s.y*H*.5,s.r,0,Math.PI*2);ctx.fillStyle='rgba(180,255,180,'+a.toFixed(2)+')';ctx.fill();});
    ctx.fillStyle='rgba(40,100,40,.06)';
    for(let mi=0;mi<3;mi++){const mx=((t*.002+mi*.33)%1)*W*1.5-W*.25;ctx.beginPath();ctx.ellipse(mx,H*.5,200,50,0,0,Math.PI*2);ctx.fill();}
    const gY=H*.52;
    for(let tx=0;tx<W;tx+=45){const th=50+Math.abs(Math.sin(tx*.04+1))*40;ctx.fillStyle='#0d2a0a';ctx.beginPath();ctx.moveTo(tx+22,gY-th);ctx.lineTo(tx+44,gY);ctx.lineTo(tx,gY);ctx.closePath();ctx.fill();}
    for(let fx=20;fx<W;fx+=60){const fh=35+Math.abs(Math.sin(fx*.05))*25;ctx.fillStyle='#1a4010';ctx.beginPath();ctx.moveTo(fx+20,gY-fh);ctx.lineTo(fx+40,gY);ctx.lineTo(fx,gY);ctx.closePath();ctx.fill();}
    ctx.fillStyle='#0a2008';ctx.fillRect(0,gY,W,H-gY);
    ctx.fillStyle='#1a4a10';ctx.fillRect(0,gY,W,6);
    ctx.fillStyle='rgba(20,80,15,.6)';ctx.fillRect(0,gY+6,W,H-gY-6);
    for(let fi=0;fi<8;fi++){const fa=.4+.6*Math.abs(Math.sin(t*.03+fi*1.4));ctx.fillStyle='rgba(150,255,100,'+fa+')';ctx.beginPath();ctx.arc(((fi*.137+t*.0008)%1)*W,(gY-20+Math.sin(t*.05+fi)*15),1.5,0,Math.PI*2);ctx.fill();}
  }
  function drawFactoryBg(ctx:CanvasRenderingContext2D,W:number,H:number,t:number){
    ctx.fillStyle='#120c00';ctx.fillRect(0,0,W,H);
    bgStarsInit.forEach(s=>{const a=.15+.5*Math.abs(Math.sin(t*.006+s.ph));ctx.beginPath();ctx.arc(s.x*W,s.y*H*.55,s.r,0,Math.PI*2);ctx.fillStyle='rgba(255,160,50,'+a.toFixed(2)+')';ctx.fill();});
    const gY=H*.55;ctx.fillStyle='#1a0e00';
    ([.1,.3,.5,.7,.85] as number[]).forEach((fx,i)=>{const fw=[60,40,80,45,35][i],fh=[70,50,90,60,45][i];ctx.fillRect(fx*W,gY-fh,fw,fh);ctx.fillRect(fx*W+5,gY-fh-18,10,18);const sa=.25+.25*Math.sin(t*.05+fx*10);ctx.fillStyle='rgba(80,60,30,'+sa+')';ctx.beginPath();ctx.arc(fx*W+10,gY-fh-18-((t*.5)%30),6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1a0e00';});
    ctx.fillStyle='#1a0800';ctx.fillRect(0,gY,W,H-gY);
    ctx.fillStyle='rgba(200,100,20,.2)';ctx.fillRect(0,gY,W,4);
  }
  function drawSpaceBg(ctx:CanvasRenderingContext2D,W:number,H:number,t:number){
    ctx.fillStyle='#040412';ctx.fillRect(0,0,W,H);
    bgStarsInit.forEach(s=>{const a=.3+.7*Math.abs(Math.sin(t*.004+s.ph));ctx.beginPath();ctx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2);ctx.fillStyle='rgba(200,200,255,'+a.toFixed(2)+')';ctx.fill();});
    ctx.fillStyle='#1a1060';ctx.beginPath();ctx.arc(W*.15,H*.2,35,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(100,80,200,.4)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(W*.15,H*.2,55,12,-.3,0,Math.PI*2);ctx.stroke();
    const na=.04+.02*Math.sin(t*.008);
    ctx.fillStyle='rgba(80,40,150,'+na+')';ctx.beginPath();ctx.ellipse(W*.6,H*.3,100,60,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(40,80,150,'+na+')';ctx.beginPath();ctx.ellipse(W*.7,H*.25,80,50,0,0,Math.PI*2);ctx.fill();
    const gY=H*.58;ctx.fillStyle='#0c0c28';ctx.fillRect(0,gY,W,H-gY);
    ctx.fillStyle='rgba(60,60,180,.2)';ctx.fillRect(0,gY,W,4);
    ctx.strokeStyle='rgba(60,60,120,.25)';ctx.lineWidth=1;
    for(let gl=0;gl<W;gl+=40){ctx.beginPath();ctx.moveTo(gl,gY);ctx.lineTo(gl,H);ctx.stroke();}
  }
  /** ฟ้าแลบบนท้องฟ้าแมพ (2–3 ลำ) — ใช้กับปราสาท / บอส */
  function drawMapLightningFlashes(ctx:CanvasRenderingContext2D,W:number,H:number,t:number,horizonY:number){
    ctx.save();
    ctx.lineCap='round';
    ctx.lineJoin='round';
    const yTop=H*0.02;
    const yBot=Math.min(horizonY*0.9,H*0.52);
    for(let b=0;b<3;b++){
      const period=88+b*47;
      const tick=(t+b*29)%period;
      if(tick>7)continue;
      const flash=1-tick/7;
      const xBase=W*(0.11+b*0.31)+Math.sin(t*0.028+b*1.15)*W*0.035;
      ctx.strokeStyle='rgba(255,245,220,'+(0.12+flash*0.85)+')';
      ctx.lineWidth=1.1+flash*2.8;
      ctx.shadowColor='rgba(255,200,120,'+(0.45+flash*0.55)+')';
      ctx.shadowBlur=10+flash*18;
      ctx.beginPath();
      ctx.moveTo(xBase,yTop);
      let cx=xBase;
      const segs=8;
      for(let s=1;s<=segs;s++){
        const fy=yTop+(yBot-yTop)*(s/segs);
        const jag=Math.sin(t*0.12+b*2.1+s*1.85)*(9+flash*16);
        cx=xBase+jag;
        ctx.lineTo(cx,fy);
      }
      ctx.lineTo(cx+Math.sin(b*1.6+t*0.09)*14*flash,yBot);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawCastleBg(ctx:CanvasRenderingContext2D,W:number,H:number,t:number){
    ctx.fillStyle='#0d0005';ctx.fillRect(0,0,W,H);
    bgStarsInit.forEach(s=>{const a=.2+.8*Math.abs(Math.sin(t*.007+s.ph));const hue=Math.sin(s.ph*5)>.5;ctx.beginPath();ctx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2);ctx.fillStyle=(hue?'rgba(255,100,80,':'rgba(180,100,255,')+a.toFixed(2)+')';ctx.fill();});
    const gY=H*.54;
    drawMapLightningFlashes(ctx,W,H,t,gY);
    ctx.fillStyle='#1a0010';
    ctx.fillRect(W*.35,gY-100,80,100);
    for(let bt=0;bt<5;bt++)ctx.fillRect(W*.35+bt*16,gY-110,10,12);
    ctx.fillRect(W*.25,gY-75,45,75);ctx.fillRect(W*.6,gY-80,45,80);
    ctx.fillStyle='#0d0005';ctx.beginPath();ctx.arc(W*.5,gY,20,Math.PI,0);ctx.fill();ctx.fillRect(W*.43,gY-28,34,28);
    ctx.fillStyle='rgba(200,60,10,.25)';
    for(let lv2=0;lv2<3;lv2++){const lx=((t*.003+lv2*.33)%1)*W*1.2-W*.1;ctx.beginPath();ctx.ellipse(lx,gY+8,40,8,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#1a0005';ctx.fillRect(0,gY,W,H-gY);
  }
  function drawBossBg(ctx:CanvasRenderingContext2D,W:number,H:number,t:number,type:string){
    ctx.fillStyle='#0d0005';ctx.fillRect(0,0,W,H);
    bgStarsInit.forEach(s=>{const a=.1+.9*Math.abs(Math.sin(t*.01+s.ph));ctx.beginPath();ctx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2);ctx.fillStyle='rgba(255,80,50,'+a.toFixed(2)+')';ctx.fill();});
    const ac=type==='prime'?'rgba(255,30,255,':'rgba(216,90,48,';
    for(let ri=0;ri<4;ri++){const ox=(Math.sin(t*.003+ri*1.7)+1)*.5*W,oy=(Math.cos(t*.002+ri)*.3+.55)*H;ctx.beginPath();ctx.arc(ox,oy,70+ri*25,0,Math.PI*2);ctx.fillStyle=ac+(.03+.02*Math.sin(t*.02+ri))+')';ctx.fill();}
    const gY=H*.57;
    drawMapLightningFlashes(ctx,W,H,t,gY);
    ctx.fillStyle='#18000a';ctx.fillRect(0,gY,W,H-gY);
    ctx.fillStyle='rgba(220,40,10,.22)';ctx.fillRect(0,gY,W,5);
    for(let cx=0;cx<W;cx+=36){const ch=6+Math.abs(Math.sin(cx*.09+t*.004))*14;ctx.fillStyle='rgba(200,30,8,.28)';ctx.beginPath();ctx.moveTo(cx,gY);ctx.lineTo(cx+18,gY-ch);ctx.lineTo(cx+36,gY);ctx.fill();}
  }

  /* entities */
  function drawGoal(ctx:CanvasRenderingContext2D,W:number,H:number,t:number,g:MapGoal){
    const gx=g.x*W,gy=g.y*H,p=.5+.5*Math.sin(t*.07);
    ctx.strokeStyle='rgba(29,158,117,'+(.35+.4*p)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(gx,gy,20,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(29,158,117,'+(.14+.14*p)+')';ctx.lineWidth=1;ctx.beginPath();ctx.arc(gx,gy,28,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#1D9E75';ctx.strokeStyle='#085041';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(gx,gy-11);ctx.lineTo(gx,gy+11);ctx.moveTo(gx-11,gy);ctx.lineTo(gx+11,gy);ctx.stroke();
    ctx.beginPath();ctx.arc(gx,gy,4.5,0,Math.PI*2);ctx.fill();
  }
  function drawColls(ctx:CanvasRenderingContext2D,W:number,H:number,t:number,colls:MapCoin[]){
    colls.forEach(c=>{
      if(c.collected)return;
      const cx2=c.x*W,cy=c.y*H+Math.sin(t*.07+c.x*10)*2.5;
      if(c.isCrystal){const cp=.4+.6*Math.abs(Math.sin(t*.06));ctx.fillStyle='rgba(174,169,236,'+cp+')';ctx.beginPath();ctx.arc(cx2,cy,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#AFA9EC';ctx.strokeStyle='#7F77DD';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx2,cy-10);ctx.lineTo(cx2+7,cy);ctx.lineTo(cx2,cy+10);ctx.lineTo(cx2-7,cy);ctx.closePath();ctx.fill();ctx.stroke();}
      else if(c.isKey){ctx.fillStyle='#9FE1CB';ctx.strokeStyle='#0F6E56';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx2,cy,7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#085041';ctx.fillRect(cx2+4,cy-1,7,2);}
      else if(c.isTorch){ctx.fillStyle='#c07010';ctx.fillRect(cx2-3,cy-2,6,10);ctx.fillStyle='rgba(255,180,50,.85)';ctx.beginPath();ctx.arc(cx2,cy-5,5,0,Math.PI*2);ctx.fill();}
      else if(c.isFlask){ctx.fillStyle='rgba(127,119,221,.55)';ctx.strokeStyle='#534AB7';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx2,cy,7,0,Math.PI*2);ctx.fill();ctx.stroke();}
      else{ctx.fillStyle='#F5C518';ctx.strokeStyle='#D4A017';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx2,cy,6,0,Math.PI*2);ctx.fill();ctx.stroke();}
    });
  }
  function drawDoor(ctx:CanvasRenderingContext2D,dx:number,dy:number){
    ctx.fillStyle='#E24B4A';ctx.strokeStyle='#791F1F';ctx.lineWidth=1.5;ctx.beginPath();ctx.rect(dx-12,dy-22,24,44);ctx.fill();ctx.stroke();
    ctx.fillStyle='#F5C518';ctx.beginPath();ctx.arc(dx+5,dy,3,0,Math.PI*2);ctx.fill();
  }

  /* monsters */
  function drawSlime(ctx:CanvasRenderingContext2D,ex:number,ey:number,t:number){
    const sq=Math.sin(t*.07)*2;
    ctx.fillStyle='#4aaa22';ctx.strokeStyle='#2a6a10';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(ex,ey,14+sq,10-sq,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(100,200,50,.4)';ctx.beginPath();ctx.ellipse(ex,ey,9+sq,7-sq,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#0a2005';ctx.beginPath();ctx.arc(ex-4,ey-1,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ex+4,ey-1,2.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#0a2005';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(ex,ey+3,3,0,Math.PI);ctx.stroke();
  }
  function drawGoblin(ctx:CanvasRenderingContext2D,ex:number,ey:number){
    ctx.fillStyle='#2a6a10';ctx.strokeStyle='#143a08';ctx.lineWidth=1.5;ctx.beginPath();ctx.rect(ex-11,ey-16,22,24);ctx.fill();ctx.stroke();
    ctx.fillStyle='#3a8a18';ctx.beginPath();ctx.arc(ex,ey-8,9,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#2a6a10';ctx.beginPath();ctx.moveTo(ex-9,ey-12);ctx.lineTo(ex-16,ey-20);ctx.lineTo(ex-5,ey-14);ctx.fill();
    ctx.beginPath();ctx.moveTo(ex+9,ey-12);ctx.lineTo(ex+16,ey-20);ctx.lineTo(ex+5,ey-14);ctx.fill();
    ctx.fillStyle='#100800';ctx.beginPath();ctx.arc(ex-3,ey-9,2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ex+3,ey-9,2,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#100800';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(ex,ey-5,2.5,0,Math.PI);ctx.stroke();
    ctx.strokeStyle='#2a6a10';ctx.lineWidth=2.5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(ex-12,ey-8);ctx.lineTo(ex-18,ey-2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(ex+12,ey-8);ctx.lineTo(ex+18,ey-2);ctx.stroke();ctx.lineCap='butt';
  }
  function drawMonster(ctx:CanvasRenderingContext2D,ex:number,ey:number,type:string,t:number){
    switch(type){case'goblin':drawGoblin(ctx,ex,ey);break;default:drawSlime(ctx,ex,ey,t);}
  }

  /* bosses */
  function drawBossGlitch(ctx:CanvasRenderingContext2D,ex:number,ey:number,t:number){
    const aa=.07+.05*Math.sin(t*.04);ctx.fillStyle='rgba(226,75,74,'+aa+')';ctx.beginPath();ctx.arc(ex,ey-18,55,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#18000a';ctx.strokeStyle='#E24B4A';ctx.lineWidth=2;ctx.beginPath();ctx.rect(ex-22,ey-32,44,52);ctx.fill();ctx.stroke();
    ([[ex-8,ey-20],[ex,ey-20],[ex+8,ey-20],[ex-8,ey-12],[ex,ey-12],[ex+8,ey-12]] as number[][]).forEach((p,i)=>{const a=.4+.6*Math.abs(Math.sin(t*.09+i*.8));ctx.fillStyle='rgba(226,75,74,'+a+')';ctx.beginPath();ctx.arc(p[0],p[1],2.5,0,Math.PI*2);ctx.fill();});
    ctx.fillStyle='#220008';ctx.strokeStyle='#E24B4A';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ex,ey-44,17,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#E24B4A';ctx.beginPath();ctx.moveTo(ex-14,ey-53);ctx.lineTo(ex-19,ey-68);ctx.lineTo(ex-8,ey-55);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(ex+14,ey-53);ctx.lineTo(ex+19,ey-68);ctx.lineTo(ex+8,ey-55);ctx.closePath();ctx.fill();
    const ea=.6+.4*Math.sin(t*.13);ctx.fillStyle='rgba(255,20,20,'+ea+')';ctx.beginPath();ctx.arc(ex,ey-44,7.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(ex,ey-44,3,0,Math.PI*2);ctx.fill();
    [-1,1].forEach(side=>{const cx3=ex+side*32,cy3=ey-10;ctx.fillStyle='#18000a';ctx.strokeStyle='#E24B4A';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx3,cy3,11,0,Math.PI*2);ctx.fill();ctx.stroke();for(let f=0;f<3;f++){const fa=(f-1)*.45+side*.08;ctx.strokeStyle='#E24B4A';ctx.lineWidth=1.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx3+Math.cos(fa)*11,cy3+Math.sin(fa)*11);ctx.lineTo(cx3+Math.cos(fa)*19,cy3+Math.sin(fa)*19);ctx.stroke();ctx.lineCap='butt';}});
  }
  function drawBossShadow(ctx:CanvasRenderingContext2D,ex:number,ey:number,t:number){
    const pp=.5+.5*Math.sin(t*.06);
    ctx.fillStyle='rgba(20,0,40,'+(.1+.08*pp)+')';ctx.beginPath();ctx.arc(ex,ey-15,60,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#0d0020';ctx.strokeStyle='#8040c0';ctx.lineWidth=2;ctx.beginPath();ctx.rect(ex-20,ey-30,40,48);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(80,20,120,.5)';ctx.beginPath();ctx.moveTo(ex-20,ey+18);ctx.lineTo(ex-32,ey+30);ctx.lineTo(ex+32,ey+30);ctx.lineTo(ex+20,ey+18);ctx.closePath();ctx.fill();
    ctx.fillStyle='#15003a';ctx.strokeStyle='#8040c0';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ex,ey-42,16,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(180,80,255,'+pp+')';ctx.beginPath();ctx.arc(ex-5,ey-43,4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ex+5,ey-43,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex-5,ey-43,1.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ex+5,ey-43,1.5,0,Math.PI*2);ctx.fill();
    [-1,1].forEach(s=>{ctx.fillStyle='rgba(60,10,100,.8)';ctx.strokeStyle='#8040c0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ex+s*20,ey-5);ctx.lineTo(ex+s*40,ey-25);ctx.lineTo(ex+s*42,ey+5);ctx.closePath();ctx.fill();ctx.stroke();});
  }
  function drawBossVirus(ctx:CanvasRenderingContext2D,ex:number,ey:number,t:number){
    const pp=.5+.5*Math.sin(t*.08);
    ctx.strokeStyle='rgba(50,180,50,'+(pp*.6)+')';ctx.lineWidth=1.5;
    for(let sp=0;sp<12;sp++){const sa=sp/12*Math.PI*2+t*.02,sr=28+Math.sin(t*.05+sp)*.5*6;ctx.beginPath();ctx.moveTo(ex+Math.cos(sa)*18,ey-15+Math.sin(sa)*18);ctx.lineTo(ex+Math.cos(sa)*sr,ey-15+Math.sin(sa)*sr);ctx.stroke();}
    ctx.fillStyle='#001a00';ctx.strokeStyle='#20c020';ctx.lineWidth=2;ctx.beginPath();
    for(let hx=0;hx<6;hx++){const ha=hx/6*Math.PI*2-Math.PI/6;ctx.lineTo(ex+Math.cos(ha)*22,ey-15+Math.sin(ha)*22);}ctx.closePath();ctx.fill();ctx.stroke();
    ctx.save();ctx.translate(ex,ey-15);ctx.rotate(t*.04);ctx.strokeStyle='rgba(100,255,100,.4)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.stroke();ctx.restore();
    ctx.fillStyle='rgba(50,220,50,'+pp+')';ctx.beginPath();ctx.arc(ex,ey-15,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#000';ctx.beginPath();ctx.arc(ex,ey-15,3,0,Math.PI*2);ctx.fill();
  }
  function drawBossBlackout(ctx:CanvasRenderingContext2D,ex:number,ey:number,t:number){
    const pp=.5+.5*Math.sin(t*.07);
    if(t%8<4){ctx.strokeStyle='rgba(80,120,255,'+(pp*.7)+')';ctx.lineWidth=1;for(let el=0;el<5;el++){const ea2=Math.random()*Math.PI*2,er=25+Math.random()*20;ctx.beginPath();ctx.moveTo(ex+Math.cos(ea2)*18,ey-12+Math.sin(ea2)*18);ctx.lineTo(ex+Math.cos(ea2)*er,ey-12+Math.sin(ea2)*er);ctx.stroke();}}
    ctx.fillStyle='#050520';ctx.strokeStyle='#4060ff';ctx.lineWidth=2;ctx.beginPath();ctx.rect(ex-20,ey-28,40,45);ctx.fill();ctx.stroke();
    ctx.fillStyle='#080830';ctx.strokeStyle='#4060ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ex,ey-40,15,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(80,150,255,'+pp+')';ctx.beginPath();ctx.rect(ex-8,ey-44,16,8);ctx.fill();
    ctx.strokeStyle='#4060ff';ctx.lineWidth=1.5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(ex-4,ey-55);ctx.lineTo(ex-8,ey-65);ctx.stroke();
    ctx.beginPath();ctx.moveTo(ex+4,ey-55);ctx.lineTo(ex+8,ey-65);ctx.stroke();
    ctx.fillStyle='rgba(80,150,255,'+(pp*.9)+')';ctx.beginPath();ctx.arc(ex-8,ey-65,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ex+8,ey-65,3,0,Math.PI*2);ctx.fill();ctx.lineCap='butt';
    [-1,1].forEach(s=>{ctx.strokeStyle='#4060ff';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ex+s*20,ey-15);ctx.lineTo(ex+s*34,ey-5);ctx.stroke();ctx.fillStyle='#1020a0';ctx.strokeStyle='#4060ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.rect(ex+s*30-6,ey-10,12,8);ctx.fill();ctx.stroke();ctx.lineCap='butt';});
  }
  function drawBossPrime(ctx:CanvasRenderingContext2D,ex:number,ey:number,t:number){
    const pp=.5+.5*Math.sin(t*.05),pp2=.5+.5*Math.sin(t*.08+1);
    (['rgba(255,30,255,','rgba(255,100,30,','rgba(50,100,255,'] as string[]).forEach((ac,ai)=>{const aa=.05+.04*Math.sin(t*.03+ai*1.3);const r=[55,45,35][ai];ctx.fillStyle=ac+aa+')';ctx.beginPath();ctx.arc(ex,ey-15,r,0,Math.PI*2);ctx.fill();});
    for(let ob=0;ob<4;ob++){const oa=ob/4*Math.PI*2+t*.04;const obx=ex+Math.cos(oa)*38,oby=ey-15+Math.sin(oa)*38*.5;const oc=['#ff40ff','#ff8020','#4080ff','#40ffa0'][ob];ctx.fillStyle=oc;ctx.beginPath();ctx.arc(obx,oby,4,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#0a0015';ctx.strokeStyle='#c040ff';ctx.lineWidth=2.5;ctx.beginPath();ctx.rect(ex-26,ey-36,52,60);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(180,50,255,'+(pp*.5)+')';ctx.beginPath();ctx.arc(ex,ey-10,12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,100,255,'+(pp2*.6)+')';ctx.beginPath();ctx.arc(ex,ey-10,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex,ey-10,4,0,Math.PI*2);ctx.fill();
    [16,22].forEach((r,ri)=>{ctx.save();ctx.translate(ex,ey-10);ctx.rotate(t*.03*(ri===0?1:-1));ctx.strokeStyle='rgba(180,60,255,.45)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();ctx.restore();});
    ctx.fillStyle='#120025';ctx.strokeStyle='#c040ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(ex,ey-50,19,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#c040ff';
    [-16,-8,0,8,16].forEach((dx,i)=>{const h=i===2?20:i===1||i===3?16:12;ctx.beginPath();ctx.moveTo(ex+dx-5,ey-69+2);ctx.lineTo(ex+dx,ey-69-h);ctx.lineTo(ex+dx+5,ey-69+2);ctx.closePath();ctx.fill();});
    [[-6,0],[0,-3],[6,0]].forEach(([epx,epy],ei)=>{const ea3=.6+.4*Math.sin(t*.12+ei*1.1);ctx.fillStyle='rgba(220,80,255,'+ea3+')';ctx.beginPath();ctx.arc(ex+epx,ey-50+epy,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex+epx,ey-50+epy,1.5,0,Math.PI*2);ctx.fill();});
    [-1,1].forEach(s=>{ctx.fillStyle='rgba(100,20,160,.55)';ctx.strokeStyle='rgba(180,60,255,.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(ex+s*26,ey-30);ctx.lineTo(ex+s*70,ey-60);ctx.lineTo(ex+s*65,ey-20);ctx.lineTo(ex+s*55,ey+10);ctx.lineTo(ex+s*26,ey+24);ctx.closePath();ctx.fill();ctx.stroke();});
    [-1,1].forEach(s=>{ctx.fillStyle='#150030';ctx.strokeStyle='#c040ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ex+s*35,ey+15,13,0,Math.PI*2);ctx.fill();ctx.stroke();for(let cf=0;cf<4;cf++){const cfa=(cf-1.5)*.4+s*0.1;ctx.strokeStyle='#c040ff';ctx.lineWidth=1.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ex+s*35+Math.cos(cfa)*13,ey+15+Math.sin(cfa)*13);ctx.lineTo(ex+s*35+Math.cos(cfa)*22,ey+15+Math.sin(cfa)*22);ctx.stroke();ctx.lineCap='butt';}});
  }
  function drawBossChar(ctx:CanvasRenderingContext2D,ex:number,ey:number,type:string,t:number){
    const bob=Math.sin(t*.05)*3;ey+=bob;
    switch(type){case'shadow':drawBossShadow(ctx,ex,ey,t);break;case'virus':drawBossVirus(ctx,ex,ey,t);break;case'blackout':drawBossBlackout(ctx,ex,ey,t);break;case'prime':drawBossPrime(ctx,ex,ey,t);break;default:drawBossGlitch(ctx,ex,ey,t);}
  }

  function drawEnemies(ctx:CanvasRenderingContext2D,W:number,H:number,t:number,enemies:MapEnemy[],byteX:number,byteY:number,bossBeam:boolean,bossBeamT:{current:number}){
    enemies.forEach(e=>{
      const ex0=e.x*W,ey0=e.y*H;
      if(e.hp<=0)return;
      /* Draw boss beam only while boss is alive */
      if(e.boss&&bossBeam){
        bossBeamT.current++;
        const pa=Math.max(0,1-bossBeamT.current/42);
        ctx.strokeStyle='rgba(255,230,180,'+(pa*.9)+')';
        ctx.lineWidth=2+pa*4;
        ctx.shadowColor='rgba(255,70,40,.95)';
        ctx.shadowBlur=16*pa;
        ctx.beginPath();
        ctx.moveTo(ex0-22,ey0);
        ctx.lineTo(byteX*W+14,byteY*H);
        ctx.stroke();
        ctx.strokeStyle='rgba(255,30,30,'+(pa*.98)+')';
        ctx.lineWidth=6+pa*12;
        ctx.beginPath();
        ctx.moveTo(ex0-22,ey0);
        ctx.lineTo(byteX*W+14,byteY*H);
        ctx.stroke();
        ctx.shadowBlur=0;
      }
      const sh=(e.hitFlash||0)>0?(Math.random()-.5)*5:0;
      if((e.hitFlash||0)>0)e.hitFlash=(e.hitFlash||0)-1;
      if(e.boss)drawBossChar(ctx,ex0+sh,ey0,e.type,t);
      else drawMonster(ctx,ex0+sh,ey0,e.type||'slime',t);
      const hw=34,hx=ex0-hw/2,hy=ey0-(e.boss?72:38);
      ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(hx,hy,hw,6);
      ctx.fillStyle=e.boss?'#E24B4A':'#D85A30';ctx.fillRect(hx,hy,hw*(e.hp/e.maxhp),6);
      ctx.strokeStyle='rgba(226,75,74,.3)';ctx.lineWidth=.5;ctx.strokeRect(hx,hy,hw,6);
    });
  }
  function drawBossHUD(ctx:CanvasRenderingContext2D,W:number,H:number,enemies:MapEnemy[],lv:Level|null){
    const e=enemies[0];if(!e||e.hp<=0)return;
    const bw=180,bh=26,bxh=W/2-bw/2,byh=38;
    const bcolor=lv&&lv.map.enemy&&lv.map.enemy.type==='prime'?'rgba(180,60,255,.5)':'rgba(226,75,74,.5)';
    ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(bxh,byh,bw,bh);
    ctx.strokeStyle=bcolor;ctx.lineWidth=1;ctx.strokeRect(bxh,byh,bw,bh);
    ctx.fillStyle=lv&&lv.map.enemy&&lv.map.enemy.type==='prime'?'#c040ff':'#E24B4A';
    ctx.fillRect(bxh,byh,bw*(e.hp/e.maxhp),bh);
    ctx.fillStyle='#fff';ctx.font='bold 11px Orbitron,sans-serif';ctx.textAlign='center';
    ctx.fillText('BOSS HP '+e.hp+'/'+e.maxhp,W/2,byh+17);ctx.textAlign='left';
  }
  function drawByte(ctx:CanvasRenderingContext2D,W:number,H:number,t:number,byteX:number,byteY:number,running:boolean,ch:Char,shieldOn:boolean){
    const bx=byteX*W,by2=byteY*H;
    const bob=Math.sin(t*.08)*(running?.6:2.2);
    ctx.save();
    ctx.translate(bx,by2+bob+10);
    ctx.scale(.54,.54);
    drawShopCharById(ctx,0,0,ch.id,ch.color,ch.color2,t*(running?1.1:.75));
    ctx.restore();
    if(shieldOn){ctx.strokeStyle='rgba(56,138,221,.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(bx,by2-6+bob,22,0,Math.PI*2);ctx.stroke();}
  }
  function drawParticles(ctx:CanvasRenderingContext2D,particles:Particle[]){
    particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.07;p.life-=.032;if(p.life<=0)return;ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);ctx.fillStyle=p.color;ctx.globalAlpha=p.life;ctx.fill();});
    ctx.globalAlpha=1;
  }
  function spawnP(particles:Particle[],px:number,py:number,col:string,n:number=10){
    for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=1.5+Math.random()*2.5;particles.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:1,color:col,r:2+Math.random()*3});}
  }

  /* mini world bg */
  function drawWorldMini(wctx:CanvasRenderingContext2D,ww:number,wh:number,bg:string,wt:number,wstars:{x:number;y:number;r:number;ph:number}[]){
    switch(bg){
      case'city':wctx.fillStyle='#080818';wctx.fillRect(0,0,ww,wh);wstars.forEach(s=>{const a=.2+.6*Math.abs(Math.sin(wt*.005+s.ph));wctx.beginPath();wctx.arc(s.x,s.y,s.r,0,Math.PI*2);wctx.fillStyle='rgba(200,200,255,'+a+')';wctx.fill();});[{x:.1,w:40,h:60},{x:.3,w:28,h:45},{x:.5,w:50,h:70},{x:.7,w:32,h:50},{x:.85,w:30,h:40}].forEach(b=>{wctx.fillStyle='#0d0d28';wctx.fillRect(b.x*ww,wh-b.h,b.w,b.h);for(let wy=wh-b.h+5;wy<wh-5;wy+=9)for(let wx=b.x*ww+4;wx<b.x*ww+b.w-4;wx+=9){if(Math.sin(wy*wx)>.2){wctx.fillStyle='rgba(255,220,80,.5)';wctx.fillRect(wx,wy,4,5);}}});break;
      case'forest':wctx.fillStyle='#071208';wctx.fillRect(0,0,ww,wh);for(let ti=0;ti<ww;ti+=35){const th=30+Math.abs(Math.sin(ti*.06))*30;wctx.fillStyle='#0d280a';wctx.beginPath();wctx.moveTo(ti+17,wh-70-th);wctx.lineTo(ti+35,wh-70);wctx.lineTo(ti,wh-70);wctx.closePath();wctx.fill();}wctx.fillStyle='#0a1f07';wctx.fillRect(0,wh-70,ww,70);wctx.fillStyle='#163510';wctx.fillRect(0,wh-70,ww,5);for(let fi2=0;fi2<6;fi2++){const fa2=.4+.6*Math.abs(Math.sin(wt*.03+fi2*1.5));wctx.fillStyle='rgba(150,255,100,'+fa2+')';wctx.beginPath();wctx.arc(((fi2*.17+wt*.0006)%1)*ww,wh-75+Math.sin(wt*.05+fi2)*10,1.5,0,Math.PI*2);wctx.fill();}break;
      case'factory':wctx.fillStyle='#100800';wctx.fillRect(0,0,ww,wh);[{x:.1,w:35,h:50},{x:.3,w:25,h:40},{x:.5,w:45,h:60},{x:.7,w:30,h:45},{x:.85,w:28,h:38}].forEach(b=>{wctx.fillStyle='#180e00';wctx.fillRect(b.x*ww,wh-b.h,b.w,b.h);wctx.fillRect(b.x*ww+5,wh-b.h-14,8,14);const sa2=.25+.2*Math.sin(wt*.05+b.x*10);wctx.fillStyle='rgba(80,60,20,'+sa2+')';wctx.beginPath();wctx.arc(b.x*ww+9,wh-b.h-14-((wt*.4)%22),5,0,Math.PI*2);wctx.fill();wctx.fillStyle='#180e00';});wctx.fillStyle='#150a00';wctx.fillRect(0,wh-10,ww,10);break;
      case'space':wctx.fillStyle='#030310';wctx.fillRect(0,0,ww,wh);wstars.forEach(s=>{const a=.3+.7*Math.abs(Math.sin(wt*.004+s.ph));wctx.beginPath();wctx.arc(s.x,s.y,s.r,0,Math.PI*2);wctx.fillStyle='rgba(180,180,255,'+a+')';wctx.fill();});wctx.fillStyle='#0d0850';wctx.beginPath();wctx.arc(ww*.15,wh*.3,22,0,Math.PI*2);wctx.fill();wctx.strokeStyle='rgba(80,60,200,.4)';wctx.lineWidth=2;wctx.beginPath();wctx.ellipse(ww*.15,wh*.3,35,8,-.3,0,Math.PI*2);wctx.stroke();wctx.fillStyle='#060625';wctx.fillRect(0,wh-25,ww,25);wctx.strokeStyle='rgba(40,40,120,.3)';wctx.lineWidth=1;for(let gl=0;gl<ww;gl+=30){wctx.beginPath();wctx.moveTo(gl,wh-25);wctx.lineTo(gl,wh);wctx.stroke();}break;
      case'castle':wctx.fillStyle='#0a0005';wctx.fillRect(0,0,ww,wh);wstars.forEach(s=>{const a=.15+.7*Math.abs(Math.sin(wt*.007+s.ph));wctx.beginPath();wctx.arc(s.x,s.y,s.r,0,Math.PI*2);wctx.fillStyle='rgba(255,80,80,'+a+')';wctx.fill();});{const gy3=wh-35;wctx.fillStyle='#140010';wctx.fillRect(ww*.35,gy3-55,50,55);for(let bt3=0;bt3<4;bt3++)wctx.fillRect(ww*.35+bt3*12,gy3-62,8,9);wctx.fillStyle='#10000d';wctx.fillRect(ww*.25,gy3-40,30,40);wctx.fillRect(ww*.6,gy3-42,30,42);wctx.fillStyle='#0a0005';wctx.beginPath();wctx.arc(ww*.5,gy3,14,Math.PI,0);wctx.fill();wctx.fillRect(ww*.46,gy3-18,22,18);wctx.fillStyle='#130010';wctx.fillRect(0,gy3,ww,35);wctx.fillStyle='rgba(180,30,10,.15)';for(let lv3=0;lv3<3;lv3++){const lx=((wt*.003+lv3*.33)%1)*ww*1.2-ww*.1;wctx.beginPath();wctx.ellipse(lx,gy3+6,35,7,0,0,Math.PI*2);wctx.fill();}}break;
    }
  }

  /* ════════════════════════════════
    SHOP CHARACTER DRAWERS (unique per character)
  ════════════════════════════════ */

  /* FREE — Byte Classic: simple clean robot, big visor LED */
  function drawShopByte(ctx:CanvasRenderingContext2D,cx:number,cy:number,c:string,c2:string,t:number){
    /* legs */
    ctx.fillStyle=c2;ctx.fillRect(cx-10,cy+10,8,18);ctx.fillRect(cx+2,cy+10,8,18);
    /* body */
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=2;drawRR(ctx,cx-16,cy-20,32,32,8);ctx.fill();ctx.stroke();
    /* chest LED panel */
    ctx.fillStyle='rgba(0,0,0,.4)';drawRR(ctx,cx-10,cy-12,20,18,4);ctx.fill();
    const lb=.5+.5*Math.sin(t*.12);
    ctx.fillStyle='rgba(174,169,236,'+lb+')';ctx.beginPath();ctx.arc(cx-4,cy-6,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(100,255,150,'+lb+')';ctx.beginPath();ctx.arc(cx+4,cy-6,3,0,Math.PI*2);ctx.fill();
    /* head */
    ctx.fillStyle=lighten(c,.28);ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy-32,14,0,Math.PI*2);ctx.fill();ctx.stroke();
    /* wide visor */
    ctx.fillStyle='rgba(0,0,0,.6)';drawRR(ctx,cx-11,cy-41,22,12,5);ctx.fill();
    ctx.fillStyle='rgba(174,169,236,'+(lb*.8)+')';drawRR(ctx,cx-10,cy-40,20,10,4);ctx.fill();
    /* eyes in visor */
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx-5,cy-35,2.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx+5,cy-35,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=c2;ctx.beginPath();ctx.arc(cx-5,cy-35,1.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx+5,cy-35,1.5,0,Math.PI*2);ctx.fill();
    /* arms */
    const arm=Math.sin(t*.06)*8;
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=2;drawRR(ctx,cx-28,cy-14+arm,10,20,5);ctx.fill();ctx.stroke();
    drawRR(ctx,cx+18,cy-14-arm,10,20,5);ctx.fill();ctx.stroke();
  }

  /* COMMON — Scout Bot: streamlined, green antenna, speed trail blur */
  function drawShopScout(ctx:CanvasRenderingContext2D,cx:number,cy:number,c:string,c2:string,t:number){
    /* speed trails behind */
    for(let tr=0;tr<4;tr++){const trx=cx-18-tr*8,tra=(.3-tr*.07)*Math.abs(Math.sin(t*.08+tr));ctx.fillStyle='rgba(29,158,117,'+tra+')';ctx.fillRect(trx,cy-4,6,8);}
    /* legs slim */
    ctx.fillStyle=c2;ctx.fillRect(cx-8,cy+10,7,16);ctx.fillRect(cx+1,cy+10,7,16);
    /* body streamlined */
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=2;drawRR(ctx,cx-14,cy-18,28,30,7);ctx.fill();ctx.stroke();
    /* speed stripes */
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(cx-8,cy-12);ctx.lineTo(cx-8,cy+6);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx-3,cy-12);ctx.lineTo(cx-3,cy+6);ctx.stroke();ctx.lineCap='butt';
    /* head */
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy-30,12,0,Math.PI*2);ctx.fill();ctx.stroke();
    /* radar dish antenna */
    ctx.strokeStyle=c2;ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx+2,cy-42);ctx.lineTo(cx+10,cy-52);ctx.stroke();ctx.lineCap='butt';
    const la=.5+.5*Math.sin(t*.14);ctx.fillStyle='rgba(100,255,150,'+la+')';ctx.beginPath();ctx.arc(cx+10,cy-52,4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(100,255,150,'+la*.5+')';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx+10,cy-52,8,0,Math.PI*2);ctx.stroke();
    /* face visor */
    ctx.fillStyle='rgba(0,100,50,.7)';drawRR(ctx,cx-10,cy-38,20,10,4);ctx.fill();
    ctx.fillStyle='rgba(100,255,150,.6)';drawRR(ctx,cx-9,cy-37,18,8,3);ctx.fill();
    /* arms angled */
    const arm2=Math.sin(t*.09)*14;
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=1.5;
    drawRR(ctx,cx-26,cy-12+arm2,10,18,5);ctx.fill();ctx.stroke();
    drawRR(ctx,cx+16,cy-12-arm2,10,18,5);ctx.fill();ctx.stroke();
  }

  /* RARE — Guardian X: thick armored plates, glowing shield crest */
  function drawShopGuardian(ctx:CanvasRenderingContext2D,cx:number,cy:number,c:string,c2:string,t:number){
    /* shield aura */
    const sa=.08+.06*Math.sin(t*.05);
    ctx.fillStyle='rgba(56,138,221,'+sa+')';ctx.beginPath();ctx.ellipse(cx,cy-5,48,52,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(56,138,221,'+(sa*4)+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cx,cy-5,52,56,0,0,Math.PI*2);ctx.stroke();
    /* legs thick */
    ctx.fillStyle=c2;ctx.strokeStyle=c;ctx.lineWidth=1.5;drawRR(ctx,cx-14,cy+14,12,22,4);ctx.fill();ctx.stroke();drawRR(ctx,cx+2,cy+14,12,22,4);ctx.fill();ctx.stroke();
    /* body wide armored */
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=3;drawRR(ctx,cx-22,cy-24,44,40,9);ctx.fill();ctx.stroke();
    /* shield crest center */
    const gc=.5+.5*Math.sin(t*.1);
    ctx.fillStyle='rgba(56,138,221,'+(.3+.3*gc)+')';ctx.beginPath();ctx.moveTo(cx,cy-22);ctx.lineTo(cx+12,cy-10);ctx.lineTo(cx+12,cy+6);ctx.lineTo(cx,cy+12);ctx.lineTo(cx-12,cy+6);ctx.lineTo(cx-12,cy-10);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(180,220,255,'+(.5+.5*gc)+')';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='rgba(180,220,255,'+gc+')';ctx.beginPath();ctx.arc(cx,cy-4,4,0,Math.PI*2);ctx.fill();
    /* head helmet */
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy-36,20,0,Math.PI*2);ctx.fill();ctx.stroke();
    /* visor slit */
    ctx.fillStyle='rgba(0,30,80,.8)';ctx.fillRect(cx-14,cy-44,28,12);
    ctx.fillStyle='rgba(80,160,255,'+(gc*.9)+')';ctx.fillRect(cx-12,cy-43,24,10);
    /* massive shoulder pads */
    ctx.fillStyle=c2;ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1;
    drawRR(ctx,cx-40,cy-28,18,24,6);ctx.fill();ctx.stroke();
    drawRR(ctx,cx+22,cy-28,18,24,6);ctx.fill();ctx.stroke();
    /* shoulder gems */
    ctx.fillStyle='rgba(56,138,221,'+gc+')';ctx.beginPath();ctx.arc(cx-31,cy-18,4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx+31,cy-18,4,0,Math.PI*2);ctx.fill();
  }

  /* RARE — Pyro-Bot: fire everywhere, aggressive orange/red */
  function drawShopPyro(ctx:CanvasRenderingContext2D,cx:number,cy:number,c:string,c2:string,t:number){
    /* fire aura at base */
    for(let fi=0;fi<12;fi++){const fa=fi/12*Math.PI*2;const fr=18+Math.sin(t*.15+fi)*5;const fla=.3+.4*Math.abs(Math.sin(t*.1+fi));ctx.fillStyle='rgba(255,'+(80+fi*14)+',0,'+fla+')';ctx.beginPath();ctx.arc(cx+Math.cos(fa)*fr,cy+Math.sin(fa)*fr*0.5+12,3+Math.sin(t*.2+fi)*1.5,0,Math.PI*2);ctx.fill();}
    /* legs */
    ctx.fillStyle=c2;ctx.fillRect(cx-13,cy+18,11,18);ctx.fillRect(cx+2,cy+18,11,18);
    /* body */
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=2;drawRR(ctx,cx-18,cy-22,36,42,8);ctx.fill();ctx.stroke();
    /* chest fire core */
    const fp=.5+.5*Math.sin(t*.18);
    ctx.fillStyle='rgba(255,150,50,'+fp+')';ctx.beginPath();ctx.arc(cx,cy-4,11,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,220,80,'+(fp*.8)+')';ctx.beginPath();ctx.arc(cx,cy-4,7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,200,'+(fp*.9)+')';ctx.beginPath();ctx.arc(cx,cy-4,3,0,Math.PI*2);ctx.fill();
    /* shoulder flame jets */
    [-1,1].forEach(s=>{for(let f=0;f<5;f++){const fx=cx+s*21+f*s*2,fy=cy-28-f*9;const fla=.6+.4*Math.sin(t*.18+f*1.2);ctx.fillStyle='rgba(255,'+(60+f*50)+',0,'+fla+')';ctx.beginPath();ctx.arc(fx,fy,5-f*.8,0,Math.PI*2);ctx.fill();}});
    /* head */
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy-34,17,0,Math.PI*2);ctx.fill();ctx.stroke();
    /* angry visor */
    ctx.fillStyle='rgba(60,0,0,.8)';drawRR(ctx,cx-12,cy-44,24,14,4);ctx.fill();
    ctx.fillStyle='rgba(255,80,0,'+fp+')';drawRR(ctx,cx-11,cy-43,22,12,3);ctx.fill();
    /* flame crown */
    [cx-10,cx,cx+10].forEach((fx,fi)=>{for(let fh=0;fh<5;fh++){const fha=.7+.3*Math.sin(t*.14+fi*1.7+fh*.8);ctx.fillStyle='rgba(255,'+(140-fh*28)+',0,'+fha+')';ctx.beginPath();ctx.arc(fx,cy-52-fh*7,3.5-fh*.6,0,Math.PI*2);ctx.fill();}});
    /* arms */
    const arm3=Math.sin(t*.09)*12;
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=2;drawRR(ctx,cx-30,cy-18+arm3,12,22,6);ctx.fill();ctx.stroke();drawRR(ctx,cx+18,cy-18-arm3,12,22,6);ctx.fill();ctx.stroke();
  }

  /* EPIC — Sage AI: elegant mage, orbiting data orbs, magic hat */
  function drawShopSage(ctx:CanvasRenderingContext2D,cx:number,cy:number,c:string,c2:string,t:number){
    /* orbiting data orbs */
    for(let ob=0;ob<3;ob++){const oa=ob/3*Math.PI*2+t*.05;const obx=cx+Math.cos(oa)*26,oby=cy-10+Math.sin(oa)*14;const ola=.6+.4*Math.sin(t*.1+ob);ctx.fillStyle='rgba(212,83,126,'+ola+')';ctx.beginPath();ctx.arc(obx,oby,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,180,210,'+(ola*.7)+')';ctx.beginPath();ctx.arc(obx-1,oby-1,1.5,0,Math.PI*2);ctx.fill();}
    /* robe flowing */
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(cx-22,cy-20);ctx.lineTo(cx-28,cy+36);ctx.lineTo(cx+28,cy+36);ctx.lineTo(cx+22,cy-20);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx,cy-18);ctx.lineTo(cx,cy+36);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-8,cy-14);ctx.lineTo(cx-16,cy+36);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+8,cy-14);ctx.lineTo(cx+16,cy+36);ctx.stroke();
    /* head */
    ctx.fillStyle=lighten(c,.22);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy-34,17,0,Math.PI*2);ctx.fill();ctx.stroke();
    /* witch hat */
    ctx.fillStyle=c2;ctx.strokeStyle=c;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(cx-22,cy-48);ctx.lineTo(cx,cy-78);ctx.lineTo(cx+22,cy-48);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillRect(cx-24,cy-51,48,6);
    /* hat star */
    const hs=.5+.5*Math.sin(t*.12);ctx.fillStyle='rgba(255,200,255,'+hs+')';ctx.beginPath();ctx.arc(cx,cy-60,4,0,Math.PI*2);ctx.fill();
    /* face */
    ctx.fillStyle='rgba(255,200,255,.9)';ctx.beginPath();ctx.arc(cx-5,cy-37,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx+5,cy-37,3,0,Math.PI*2);ctx.fill();
    /* staff */
    ctx.strokeStyle=c2;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-28,cy-14);ctx.lineTo(cx-24,cy+30);ctx.stroke();ctx.lineCap='butt';
    const la5=.6+.4*Math.sin(t*.1);ctx.fillStyle='rgba(255,150,255,'+la5+')';ctx.beginPath();ctx.arc(cx-28,cy-16,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,'+la5+')';ctx.beginPath();ctx.arc(cx-28,cy-16,3,0,Math.PI*2);ctx.fill();
  }

  /* LEGENDARY — TITAN CORE: massive, crown, rotating ring, dual energy cannons */
  function drawShopTitan(ctx:CanvasRenderingContext2D,cx:number,cy:number,c:string,c2:string,t:number){
    /* grand aura */
    const ta=.06+.04*Math.sin(t*.04);
    ctx.fillStyle='rgba(245,197,24,'+ta+')';ctx.beginPath();ctx.arc(cx,cy-10,56,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(245,197,24,'+(ta*4)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy-10,60,0,Math.PI*2);ctx.stroke();
    /* legs */
    ctx.fillStyle=c2;ctx.strokeStyle=c;ctx.lineWidth=2;drawRR(ctx,cx-18,cy+16,15,28,5);ctx.fill();ctx.stroke();drawRR(ctx,cx+3,cy+16,15,28,5);ctx.fill();ctx.stroke();
    /* body massive */
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=3;drawRR(ctx,cx-26,cy-28,52,46,10);ctx.fill();ctx.stroke();
    /* rotating energy ring around body */
    ctx.save();ctx.translate(cx,cy-8);ctx.rotate(t*.04);
    ctx.strokeStyle='rgba(245,197,24,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,30,0,Math.PI*2);ctx.stroke();
    for(let ri=0;ri<8;ri++){const ra=ri/8*Math.PI*2;ctx.fillStyle='rgba(245,197,24,.6)';ctx.beginPath();ctx.arc(Math.cos(ra)*30,Math.sin(ra)*30,3,0,Math.PI*2);ctx.fill();}
    ctx.restore();
    /* chest core triple ring */
    const cp=.5+.5*Math.sin(t*.09);
    ctx.fillStyle='rgba(255,255,200,'+cp+')';ctx.beginPath();ctx.arc(cx,cy-8,14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,220,50,'+(cp*.9)+')';ctx.beginPath();ctx.arc(cx,cy-8,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,200,'+(cp*.95)+')';ctx.beginPath();ctx.arc(cx,cy-8,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,cy-8,3,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(cx,cy-8);ctx.rotate(t*.05);ctx.strokeStyle='rgba(255,200,0,.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.stroke();for(let ri=0;ri<6;ri++){const ra=ri/6*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(ra)*14,Math.sin(ra)*14);ctx.lineTo(Math.cos(ra)*18,Math.sin(ra)*18);ctx.stroke();}ctx.restore();
    /* head */
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy-42,21,0,Math.PI*2);ctx.fill();ctx.stroke();
    /* crown 5 spikes */
    ctx.fillStyle=c2;
    [-18,-9,0,9,18].forEach((dx,i)=>{const h=i===2?24:i===1||i===3?18:13;ctx.beginPath();ctx.moveTo(cx+dx-6,cy-60);ctx.lineTo(cx+dx,cy-60-h);ctx.lineTo(cx+dx+6,cy-60);ctx.closePath();ctx.fill();});
    /* crown gems */
    const cga=.7+.3*Math.sin(t*.12);ctx.fillStyle='rgba(255,255,200,'+cga+')';
    [-9,0,9].forEach(dx=>{ctx.beginPath();ctx.arc(cx+dx,cy-60-16,3,0,Math.PI*2);ctx.fill();});
    /* face visor wide */
    ctx.fillStyle='rgba(0,0,20,.8)';drawRR(ctx,cx-15,cy-51,30,18,5);ctx.fill();
    ctx.fillStyle='rgba(255,220,50,'+(cp*.95)+')';drawRR(ctx,cx-13,cy-50,26,16,4);ctx.fill();
    /* massive shoulder cannons */
    ctx.fillStyle=c;ctx.strokeStyle=c2;ctx.lineWidth=2;
    drawRR(ctx,cx-50,cy-30,22,32,8);ctx.fill();ctx.stroke();
    drawRR(ctx,cx+28,cy-30,22,32,8);ctx.fill();ctx.stroke();
    /* cannon barrel */
    ctx.fillStyle='rgba(0,0,20,.7)';ctx.fillRect(cx-44,cy-36,10,8);ctx.fillRect(cx+34,cy-36,10,8);
    /* cannon energy */
    const ce=.4+.4*Math.sin(t*.15);ctx.fillStyle='rgba(255,220,50,'+ce+')';ctx.beginPath();ctx.arc(cx-38,cy-32,4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx+38,cy-32,4,0,Math.PI*2);ctx.fill();
    /* shoulder gems */
    ctx.fillStyle='rgba(255,220,50,'+cga+')';ctx.beginPath();ctx.arc(cx-39,cy-16,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx+39,cy-16,5,0,Math.PI*2);ctx.fill();
  }

  function drawShopCharById(ctx:CanvasRenderingContext2D,cx:number,cy:number,id:string,c:string,c2:string,t:number){
    switch(id){case'scout':drawShopScout(ctx,cx,cy,c,c2,t);break;case'guardian':drawShopGuardian(ctx,cx,cy,c,c2,t);break;case'pyro':drawShopPyro(ctx,cx,cy,c,c2,t);break;case'sage':drawShopSage(ctx,cx,cy,c,c2,t);break;case'titan':drawShopTitan(ctx,cx,cy,c,c2,t);break;default:drawShopByte(ctx,cx,cy,c,c2,t);}
  }

  /* ════ REUSABLE ANIMATED CANVAS HOOK ════ */
  function useAnimCanvas(drawFn:(ctx:CanvasRenderingContext2D,w:number,h:number,t:number)=>void,deps:React.DependencyList=[]){
    const ref=useRef<HTMLCanvasElement>(null);
    const tRef2=useRef(0);
    const animId=useRef(0);
    const drawRef=useRef(drawFn);
    drawRef.current=drawFn;
    useEffect(()=>{
      const C=ref.current;if(!C)return;
      function loop(){
        tRef2.current++;
        const C2=ref.current;if(!C2)return;
        const ctx=C2.getContext('2d');if(!ctx)return;
        const p=C2.parentElement;
        if(p){C2.width=p.clientWidth;C2.height=p.clientHeight;}
        drawRef.current(ctx,C2.width,C2.height,tRef2.current);
        animId.current=requestAnimationFrame(loop);
      }
      animId.current=requestAnimationFrame(loop);
      return()=>{if(animId.current)cancelAnimationFrame(animId.current);};
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },deps);
    return ref;
  }

  /* ════════════════════════════════════════════
    MAIN COMPONENT
  ════════════════════════════════════════════ */
  interface JSLogicProps{onComplete?:(r?:{success?:boolean;seconds?:number})=>void;isActive?:boolean;onRoomSkip?:()=>void;onBackToDashboard?:()=>void}
  const JSLogic:React.FC<JSLogicProps>=({onComplete})=>{
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
      const a = new Audio('/sound/Java -2.mp3');
      a.loop = true;
      a.preload = 'auto';
      audioRef.current = a;
      a.muted = isMuted;
      const playPromise = a.play();
      if (playPromise && playPromise.catch) playPromise.catch(() => {});
      return () => {
        a.pause();
        audioRef.current = null;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const a = audioRef.current;
      if (!a) return;
      a.muted = isMuted;
      if (!isMuted) {
        const playPromise = a.play();
        if (playPromise && playPromise.catch) playPromise.catch(() => {});
      }
    }, [isMuted]);

    const[S,setS]=useState<GameState>({
      gems:50,streak:5,hp:3,maxHp:3,claimed:false,
      hints:0,loggedIn:false,hintUsedThisStage:false,
      worldIdx:0,stageIdx:0,code:[],running:false,
      particles:[],t:0,
      worldProgress:[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],
      selectedChar:'free',ownedChars:['free'],
      bp:{ifm:2,loop:8,bug:1,speed:0,streak7:0,perf:0},
      mgIdx:0,mgSel:[],mgAns:[],mgScore:0,mgStreak:0,
      mgPlaysToday:0,mgLastResetDate:new Date().toDateString(),
      heartRegenTime:null,wrongAttempts:0,
    });
    const sRef=useRef(S);sRef.current=S;
    const appStageDoneRef=useRef(false);
    const onCompleteRef=useRef(onComplete);
    useEffect(()=>{onCompleteRef.current=onComplete;},[onComplete]);
    const[screen,setScreen]=useState('home');
    const[fbMsg,setFbMsg]=useState('');
    const[fbCls,setFbCls]=useState('');
    const[hintVisible,setHintVisible]=useState(false);
    const [dailyFx, setDailyFx] = useState(0);
    const [palOrder, setPalOrder] = useState<string[]>([]);
    const[resultVisible,setResultVisible]=useState(false);
    const[resultWin,setResultWin]=useState(false);
    const[resultStars,setResultStars]=useState(0);
    const[resultReward,setResultReward]=useState(0);
    const[resultBoss,setResultBoss]=useState(false);
    const[mgFb,setMgFb]=useState('');
    const[mgFbColor,setMgFbColor]=useState('');
    const[mgOptsOrder,setMgOptsOrder]=useState<string[]>([]);
    const[,forceRender]=useState(0);


    const canvasRef=useRef<HTMLCanvasElement>(null);
    const animRef=useRef<number>(0);
    const byteXRef=useRef(0.06);
    const byteTargetXRef=useRef(0.06);
    const byteYRef=useRef(0.5);
    const collsRef=useRef<MapCoin[]>([]);
    const enemiesRef=useRef<MapEnemy[]>([]);
    const doorOpenRef=useRef(false);
    const stepsRef=useRef<GameStep[]>([]);
    const stepIdxRef=useRef(0);
    const stepDelayRef=useRef(0);
    const bossBeamRef=useRef(false);
    const bossBeamTRef=useRef({current:0});
    const bossHitFxRef=useRef({frames:0,blocked:false});
    const shieldChargesRef=useRef(0);
    const shieldActiveRef=useRef(false);
    const tRef=useRef(0);
    const particlesRef=useRef<Particle[]>([]);
    const MAX_DELAY=30;

    const curLv=useCallback(():Level|null=>LEVELS[sRef.current.worldIdx*4+sRef.current.stageIdx]||null,[]);
    const getCh=useCallback(():Char=>CHARS.find(c=>c.id===sRef.current.selectedChar)||CHARS[0],[]);
    const mut=useCallback((fn:(s:GameState)=>Partial<GameState>)=>{setS(prev=>{const patch=fn(prev);return{...prev,...patch};});},[]);
    const setFB=useCallback((msg:string,cls:string='')=>{setFbMsg(msg);setFbCls(cls);},[]);

    const shuffle = useCallback(<T,>(arr:T[]):T[]=>{
      const a=[...arr];
      for(let i=a.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [a[i],a[j]]=[a[j],a[i]];
      }
      return a;
    },[]);
    const ensureShuffledPal = useCallback((lv:Level):string[]=>{
      const base=[...lv.pal];
      if(base.length<=1)return base;
      for(let tries=0;tries<8;tries++){
        const sh=shuffle(base);
        const sameAsBase=sh.every((v,i)=>v===base[i]);
        const sameAsSol=sh.length===lv.sol.length && sh.every((v,i)=>v===lv.sol[i]);
        if(!sameAsBase && !sameAsSol) return sh;
      }
      return shuffle(base);
    },[shuffle]);

    useEffect(()=>{
      try{
        const raw=localStorage.getItem(SAVE_KEY);
        if(!raw)return;
        const parsed=JSON.parse(raw) as Partial<GameState>;
        setS(prev=>({...prev,...parsed,running:false,code:[],particles:[]}));
      }catch{
        /* ignore broken save */
      }
    },[]);

    useEffect(()=>{
      try{
        const safeState:GameState={...S,running:false,code:[],particles:[]};
        localStorage.setItem(SAVE_KEY,JSON.stringify(safeState));
      }catch{
        /* ignore storage errors */
      }
    },[S]);

    useEffect(()=>{
      const id=window.setInterval(()=>{
        mut(s=>{
          if(s.hp>=s.maxHp){if(s.heartRegenTime===null)return{};return{heartRegenTime:null};}
          const now=Date.now();
          if(!s.heartRegenTime)return{heartRegenTime:now+5*60*1000};
          if(now>=s.heartRegenTime){
            const newHp=Math.min(s.maxHp,s.hp+1);
            return{hp:newHp,heartRegenTime:newHp>=s.maxHp?null:now+5*60*1000};
          }
          return{};
        });
      },1000);
      return()=>window.clearInterval(id);
    },[mut]);

    /* ════ GAME ENGINE ════ */
    const initCanvas=useCallback(()=>{
      const C=canvasRef.current;if(!C)return;
      const ctx=C.getContext('2d');if(!ctx)return;
      if(animRef.current)cancelAnimationFrame(animRef.current);
      const lv=curLv();
      if(lv){collsRef.current=lv.map.coins.map(c=>({...c}));enemiesRef.current=lv.map.enemy?[{...lv.map.enemy,hitFlash:0}]:[];}
      doorOpenRef.current=false;
      byteXRef.current=0.06;byteTargetXRef.current=0.06;byteYRef.current=0.5;
      function gameLoop(){
        tRef.current++;
        const C2=canvasRef.current;if(!C2)return;
        const ctx2=C2.getContext('2d');if(!ctx2)return;
        const wrap=C2.parentElement;
        if(wrap){
          /* LANDSCAPE: canvas wider than tall */
          const W=wrap.clientWidth;
          let H=Math.round(W*.42);if(H<200)H=200;if(H>380)H=380;
          const vh=(typeof window!=='undefined'?window.innerHeight:820);
          const maxFromViewport=Math.max(180,Math.round(vh*.34));
          if(H>maxFromViewport)H=maxFromViewport;
          C2.width=W;C2.height=H;C2.style.height=H+'px';
        }
        const W=C2.width,H=C2.height;
        const t2=tRef.current;
        const s=sRef.current;
        const lv2=LEVELS[s.worldIdx*4+s.stageIdx]||null;
        ctx2.clearRect(0,0,W,H);
        if(lv2&&lv2.boss)drawBossBg(ctx2,W,H,t2,lv2.map.enemy?.type||'glitch');
        else switch(lv2?.w||0){
          case 0:drawCityBg(ctx2,W,H,t2);break;
          case 1:drawForestBg(ctx2,W,H,t2);break;
          case 2:drawFactoryBg(ctx2,W,H,t2);break;
          case 3:drawSpaceBg(ctx2,W,H,t2);break;
          case 4:drawCastleBg(ctx2,W,H,t2);break;
          default:drawCityBg(ctx2,W,H,t2);
        }
        if(lv2)drawGoal(ctx2,W,H,t2,lv2.map.goal);
        drawColls(ctx2,W,H,t2,collsRef.current);
        if(lv2&&lv2.map.door&&!doorOpenRef.current)drawDoor(ctx2,lv2.map.door.x*W,lv2.map.door.y*H);
        drawEnemies(ctx2,W,H,t2,enemiesRef.current,byteXRef.current,byteYRef.current,bossBeamRef.current,bossBeamTRef.current);
        drawByte(ctx2,W,H,t2,byteXRef.current,byteYRef.current,s.running,getCh(),shieldActiveRef.current);
        if(bossHitFxRef.current.frames>0){
          const fx=bossHitFxRef.current;
          const alpha=Math.max(0,fx.frames/(fx.blocked?18:22));
          const bx=byteXRef.current*W,by=byteYRef.current*H;
          ctx2.save();
          ctx2.fillStyle=fx.blocked?'rgba(80,170,255,'+(alpha*.15)+')':'rgba(255,50,40,'+(alpha*.18)+')';
          ctx2.fillRect(0,0,W,H);
          ctx2.strokeStyle=fx.blocked?'rgba(133,183,235,'+(alpha*.95)+')':'rgba(255,120,90,'+(alpha*.95)+')';
          ctx2.lineWidth=2+(1-alpha)*5;
          ctx2.beginPath();
          ctx2.arc(bx,by-8,24+(1-alpha)*28,0,Math.PI*2);
          ctx2.stroke();
          ctx2.restore();
          fx.frames--;
        }
        drawParticles(ctx2,particlesRef.current);
        particlesRef.current=particlesRef.current.filter(p=>p.life>0);
        if(lv2&&lv2.boss)drawBossHUD(ctx2,W,H,enemiesRef.current,lv2);
        byteXRef.current+=(byteTargetXRef.current-byteXRef.current)*.1;
        /* step tick */
        if(sRef.current.running){
          if(stepIdxRef.current>=stepsRef.current.length){mut(()=>({running:false}));}
          else{stepDelayRef.current++;if(stepDelayRef.current>=MAX_DELAY){stepDelayRef.current=0;const st=stepsRef.current[stepIdxRef.current];stepIdxRef.current++;execStep(st);}}
        }
        animRef.current=requestAnimationFrame(gameLoop);
      }
      animRef.current=requestAnimationFrame(gameLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const execStep=useCallback((st:GameStep)=>{
      if(!st)return;
      const ch2=getCh();
      const W=canvasRef.current?.width||800,H=canvasRef.current?.height||340;
      switch(st.t){
        case'move':byteTargetXRef.current=st.tx||0;if(st.ty!==undefined)byteYRef.current=st.ty;break;
        case'collect':{const c=collsRef.current[st.ci||0];if(c){c.collected=true;spawnP(particlesRef.current,c.x*W,c.y*H,'#F5C518',12);}break;}
        case'pickup':{const c=collsRef.current[st.ci||0];if(c){c.collected=true;spawnP(particlesRef.current,c.x*W,c.y*H,'#9FE1CB',10);}break;}
        case'unlock':doorOpenRef.current=true;spawnP(particlesRef.current,W*.6,H*.5,'#5DCAA5',8);break;
        case'attack':{
          const e=enemiesRef.current[st.ei||0];
          if(!e||e.hp<=0)break;
          const atkDmg=Math.max(1,ch2.atk);
          e.hp=Math.max(0,e.hp-atkDmg);
          e.hitFlash=8;
          spawnP(particlesRef.current,e.x*W,e.y*H,'#F09595',10);
          break;
        }
        case'shield':{
          if(shieldChargesRef.current<=0){
            spawnP(particlesRef.current,byteXRef.current*W,byteYRef.current*H,'#85B7EB',5);
            setFB('🛡️ ไม่มีโล่เหลือให้ใช้','err');
            break;
          }
          shieldActiveRef.current=true;
          spawnP(particlesRef.current,byteXRef.current*W,byteYRef.current*H,'#85B7EB',10);
          setFB('🛡️ เปิดโล่! (กันการโจมตีครั้งถัดไป)','ok');
          break;
        }
        case'boss-atk':{
          const boss=enemiesRef.current[0];
          if(!boss||boss.hp<=0)break;
          boss.hitFlash=10;
          bossBeamRef.current=true;bossBeamTRef.current.current=0;
          const lv2=curLv();
          const bAtk=lv2?.bossAtk||1;
          const blocked=ch2.shield>=1;
          const dmg=blocked?0:bAtk;
          const prevHp=sRef.current.hp;
          const hpAfter=Math.max(0,prevHp-dmg);
          mut(()=>({hp:hpAfter}));
          spawnP(particlesRef.current,boss.x*W,boss.y*H,'#FF6A5B',14);
          bossHitFxRef.current={frames:blocked?18:22,blocked};
          spawnP(particlesRef.current,byteXRef.current*W,byteYRef.current*H,blocked?'#85B7EB':'#E24B4A',blocked?12:18);
          if(dmg>0)setFB('BOSS โจมตี -'+dmg+' ❤️!','err');
          else setFB('🛡️ DEF ป้องกันการโจมตีได้!','ok');
          setTimeout(()=>{bossBeamRef.current=false;},700);
          if(hpAfter<=0){
            stepsRef.current=[];
            stepIdxRef.current=0;
            stepDelayRef.current=0;
            mut(()=>({running:false}));
            setTimeout(()=>loseGame(),400);
          }
          break;
        }
        case'win':doWin();break;
        case'fail':doFail(st.msg);break;
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const doWin=useCallback(()=>{
      if(sRef.current.hp<=0){
        loseGame();
        return;
      }
      mut(s=>{
        const lv=LEVELS[s.worldIdx*4+s.stageIdx]||null;
        let stars=3;
        if(s.hp<=0)stars=0;
        else if(s.wrongAttempts>=2||s.hp<=1)stars=1;
        else if(s.wrongAttempts===1||s.hp<s.maxHp||s.hintUsedThisStage)stars=2;
        const ifUses=s.code.filter(b=>b.startsWith('IF ')).length;
        const speedSet=s.code.find(b=>/^setVar\s+speed=\d+/.test(b));
        const speedVal=speedSet?Math.max(1,parseInt((speedSet.match(/^setVar\s+speed=(\d+)/)||[])[1]||'1',10)):1;
        const loopRounds=s.code.reduce((n,b)=>{
          const num=b.match(/^LOOP\s+(\d+)/);
          if(num)return n+Math.max(1,parseInt(num[1],10));
          if(b==='LOOP speed')return n+speedVal;
          return n;
        },0);
        const wp=s.worldProgress.map(r=>[...r]);
        const prevStars=wp[s.worldIdx][s.stageIdx]||0;
        wp[s.worldIdx][s.stageIdx]=Math.max(prevStars,stars);
        const boss=lv?.boss||false;
        const reward=(REWARD_BY_STARS[stars]||0)+(boss?(BOSS_BONUS_BY_STARS[stars]||0):0);
        const bp2={...s.bp};if(boss)bp2.bug=(bp2.bug||0)+1;
        bp2.ifm=(bp2.ifm||0)+ifUses;
        bp2.loop=(bp2.loop||0)+loopRounds;
        if(stars===3){bp2.perf=(bp2.perf||0)+1;bp2.speed=(bp2.speed||0)+1;}
        setResultWin(true);setResultStars(stars);setResultReward(reward);setResultBoss(boss);setResultVisible(true);
        setFB('');
        const g=lv?.map.goal||{x:.9,y:.45};
        const W=canvasRef.current?.width||800,H=canvasRef.current?.height||340;
        spawnP(particlesRef.current,g.x*W,g.y*H,'#7F77DD',20);spawnP(particlesRef.current,W*.5,H*.5,'#F5C518',15);
        return{running:false,gems:s.gems+reward,worldProgress:wp,bp:bp2,wrongAttempts:0,hintUsedThisStage:false};
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const doFail=useCallback((msg?:string)=>{
      mut(s=>{
        const newHp=Math.max(0,s.hp-1);
        setFB(msg||'Code ไม่ถูกต้อง','err');
        const lvNow=LEVELS[s.worldIdx*4+s.stageIdx];
        if(lvNow?.boss){
          bossBeamRef.current=true;
          bossBeamTRef.current.current=0;
          setTimeout(()=>{bossBeamRef.current=false;},700);
        }
        spawnP(particlesRef.current,byteXRef.current*(canvasRef.current?.width||800),byteYRef.current*(canvasRef.current?.height||340),'#E24B4A',12);
        if(newHp<=0){
          stepsRef.current=[];
          stepIdxRef.current=0;
          stepDelayRef.current=0;
          setTimeout(()=>loseGame(),900);
        }
        return{running:false,hp:newHp,wrongAttempts:s.wrongAttempts+1};
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const loseGame=useCallback(()=>{
      setResultWin(false);setResultStars(0);setResultReward(0);setResultBoss(false);setResultVisible(true);
      mut(()=>({wrongAttempts:0}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const runCode=useCallback(()=>{
      const s=sRef.current;if(s.running)return;
      const lv=LEVELS[s.worldIdx*4+s.stageIdx];if(!lv)return;
      if(s.hp<=0){setFB('❤️ HP หมด! ซื้อหัวใจที่ร้านค้าหรือรอรีเจน','err');return;}
      if(s.code.length===0){setFB('ยังไม่มี block!','err');return;}
      mut(()=>({running:true,particles:[]}));
      particlesRef.current=[];
      setResultVisible(false);setFB('');setHintVisible(false);
      byteXRef.current=0.06;byteTargetXRef.current=0.06;byteYRef.current=0.5;
      collsRef.current=lv.map.coins.map(c=>({...c}));
      enemiesRef.current=lv.map.enemy?[{...lv.map.enemy,hitFlash:0}]:[];
      shieldChargesRef.current=getCh().shield||0;
      shieldActiveRef.current=false;
      doorOpenRef.current=false;stepsRef.current=[];stepIdxRef.current=0;stepDelayRef.current=0;bossBeamRef.current=false;
      const ok=s.code.length===lv.sol.length&&s.code.every((v,i)=>v===lv.sol[i]);
      if(ok){
        const ch3=getCh();
        stepsRef.current.push({t:'move',tx:.3,ty:.5});
        if(lv.boss)stepsRef.current.push({t:'boss-atk'});
        if(lv.boss)stepsRef.current.push({t:'shield'});
        lv.map.coins.forEach((c,ci)=>{stepsRef.current.push({t:c.isKey||c.isTorch||c.isFlask?'pickup':'collect',ci});});
        if(lv.map.enemy){
          const loops=s.code.reduce((n,b)=>{const m=b.match(/LOOP\s+(\d+)/);return m?Math.max(1,parseInt(m[1],10)):n;},1);
          const attackBlocks=s.code.filter(b=>b.includes('โจมตี')).length;
          if(attackBlocks===0){
            stepsRef.current.push({t:'fail',msg:'ต้องมี block "โจมตี" เพื่อทำดาเมจ'});
            return;
          }
          const totalHits=Math.max(1,loops*attackBlocks);
          for(let i=0;i<totalHits;i++)stepsRef.current.push({t:'attack',ei:0});
        }
        if(lv.map.door)stepsRef.current.push({t:'unlock'});
        stepsRef.current.push({t:'move',tx:lv.map.goal.x,ty:lv.map.goal.y});stepsRef.current.push({t:'win'});
      }else{
        const missing=lv.sol.filter(x=>s.code.indexOf(x)===-1);
        const extra=s.code.filter(x=>lv.sol.indexOf(x)===-1);
        let msg2='Code ไม่ถูกต้อง';
        if(missing.length)msg2+=' — ขาด: "'+missing[0]+'"';
        if(extra.length)msg2+=' — เกิน: "'+extra[0]+'"';
        if(!missing.length&&!extra.length)msg2+=' — ลำดับไม่ถูก';
        stepsRef.current.push({t:'fail',msg:msg2});
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const clearCode=useCallback(()=>{
      mut(()=>({code:[],running:false}));
      stepsRef.current=[];stepIdxRef.current=0;stepDelayRef.current=0;
      shieldActiveRef.current=false;
      setResultVisible(false);setFB('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const loadStage=useCallback(()=>{
      const s=sRef.current;const lv=LEVELS[s.worldIdx*4+s.stageIdx];if(!lv)return;
      if(s.hp<=0){setScreen('shop');return;}
      mut(()=>({code:[],running:false,hintUsedThisStage:false}));
      particlesRef.current=[];
      byteXRef.current=0.06;byteTargetXRef.current=0.06;byteYRef.current=0.5;
      collsRef.current=lv.map.coins.map(c=>({...c}));
      enemiesRef.current=lv.map.enemy?[{...lv.map.enemy,hitFlash:0}]:[];
      shieldChargesRef.current=getCh().shield||0;
      shieldActiveRef.current=false;
      doorOpenRef.current=false;stepsRef.current=[];stepIdxRef.current=0;stepDelayRef.current=0;bossBeamRef.current=false;
      setResultVisible(false);setHintVisible(false);setFB('');
      setPalOrder(ensureShuffledPal(lv));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const nextStage=useCallback(()=>{
      const s=sRef.current;
      if(s.hp<=0){
        void Swal.fire({icon:'warning',title:'HP หมด',text:'ต้องฟื้นฟูหัวใจก่อนไปด่านถัดไป',confirmButtonText:'ตกลง'});
        return;
      }
      if(s.worldProgress[s.worldIdx][s.stageIdx]===0){return;}
      if(s.stageIdx<3){
        mut(s2=>({stageIdx:s2.stageIdx+1,wrongAttempts:0}));
        setTimeout(()=>{loadStage();},50);
        return;
      }
      if(s.worldIdx<WORLDS.length-1){
        mut(s2=>({worldIdx:s2.worldIdx+1,stageIdx:0,wrongAttempts:0}));
        setResultVisible(false);
        setScreen('stage');
        return;
      }
      const notify=onCompleteRef.current;
      if(notify&&!appStageDoneRef.current){
        appStageDoneRef.current=true;
        notify({success:true});
        return;
      }
      setResultVisible(false);
      setScreen('worlds');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const retryStage=useCallback(()=>{
      const ch=getCh();mut(()=>({hp:ch.hp,maxHp:ch.hp,wrongAttempts:0,hintUsedThisStage:false}));
      setTimeout(()=>{loadStage();},50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const startStage=useCallback((si:number)=>{
      if(sRef.current.hp<=0){
        void Swal.fire({
          icon:'warning',
          title:'หัวใจหมด',
          text:'ซื้อหัวใจที่ร้านค้า (100G=1❤️) หรือรอรีเจน 1 หัวใจ/5 นาที',
          confirmButtonText:'ไปที่ร้านค้า',
        }).then(()=>setScreen('shop'));
        return;
      }
      mut(()=>({stageIdx:si,wrongAttempts:0,hintUsedThisStage:false}));setScreen('game');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const goScreen=useCallback((name:string)=>{
      if(name==='game' && sRef.current.hp<=0){
        void Swal.fire({
          icon:'warning',
          title:'หัวใจหมด',
          text:'ซื้อหัวใจที่ร้านค้า (100G=1❤️) หรือรอรีเจน 1 หัวใจ/5 นาที',
          confirmButtonText:'ไปที่ร้านค้า',
        }).then(()=>setScreen('shop'));
        return;
      }
      setScreen(name);
      if(name==='game'){setTimeout(()=>{initCanvas();loadStage();},100);}
      if(name==='minigame')loadMGFn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    useEffect(()=>{
      if(screen==='game'){setTimeout(()=>{initCanvas();loadStage();},100);}
      return()=>{if(animRef.current)cancelAnimationFrame(animRef.current);};
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[screen]);

    /* DAILY */
    const claimDaily=useCallback(()=>{
      if(sRef.current.claimed)return;
      mut(s=>{
        const r=DREW[Math.min(s.streak,6)];
        const newStreak=Math.min(7,s.streak+1);
        const bp2={...s.bp};
        if(newStreak>=7)bp2.streak7=7;
        const isHintReward=String(r.l||'').toLowerCase().includes('hint') || r.icon==='💡';
        return{
          claimed:true,
          gems:isHintReward?s.gems:(s.gems+r.v),
          hints:isHintReward?(s.hints+r.v):s.hints,
          streak:newStreak,
          bp:bp2,
        };
      });
      setDailyFx(n=>n+1);
      window.setTimeout(()=>setDailyFx(n=>n+1),450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);
    const missDaily=useCallback(()=>{mut(()=>({streak:0,claimed:false}));},[mut]);

    const loginAndGrantHint = useCallback(()=>{
      mut(s=>{
        if(s.loggedIn) return {};
        return { loggedIn:true, hints:Math.max(1,s.hints) };
      });
      setDailyFx(n=>n+1);
    },[mut]);

    const useHint = useCallback(()=>{
      const s=sRef.current;
      if(s.running) return;
      if(s.hints<=0){setFB('💡 Hint หมดแล้ว (ต้องล็อคอินหรือรับจาก Daily)','err');return;}
      if(s.hp<=1){setFB('❤️ HP เหลือน้อยเกินไป ใช้ Hint ไม่ได้ (Hint จะเสียหัวใจ 1)','err');return;}
      mut(s2=>{
        const now=Date.now();
        const nextHp=Math.max(0,s2.hp-1);
        const nextHints=Math.max(0,s2.hints-1);
        const nextHeartRegenTime =
          nextHp>=s2.maxHp ? null :
          (s2.heartRegenTime ?? (now+5*60*1000));
        return{hints:nextHints,hp:nextHp,heartRegenTime:nextHeartRegenTime,hintUsedThisStage:true};
      });
      setHintVisible(true);
      setFB('💡 ใช้ Hint แล้ว (-1 Hint, -1 ❤️)','ok');
    },[mut,setFB]);

    /* MINI-GAME */
    const loadMGFn=useCallback(()=>{
      const today=new Date().toDateString();
      mut(s=>{let ns={...s};if(s.mgLastResetDate!==today){ns={...ns,mgPlaysToday:0,mgLastResetDate:today,mgScore:0};}
        const q=MG_Q[ns.mgIdx%MG_Q.length];ns.mgAns=q.ans.slice();ns.mgSel=[];
        setMgFb('');setMgFbColor('');setMgOptsOrder([...q.blocks].sort(()=>.5-Math.random()));
        return ns;});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const selectMGOpt=useCallback((o:string)=>{
      mut(s=>{if(s.mgSel.length>=s.mgAns.length)return{};const newSel=[...s.mgSel,o];return{mgSel:newSel};});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const unselectMGSlot=useCallback((slotIdx:number)=>{
      mut(s=>{const newSel=[...s.mgSel];newSel[slotIdx]=null;return{mgSel:newSel};});forceRender(n=>n+1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const checkMG=useCallback(()=>{
      const s=sRef.current;
      if(s.mgPlaysToday>=5){setMgFb('❌ เล่นครบ 5 รอบแล้ววันนี้!');setMgFbColor('#E24B4A');return;}
      const correct=s.mgSel.every((v,i)=>v===s.mgAns[i]);
      if(correct){
        let reward=20;if(s.mgScore+reward>100)reward=100-s.mgScore;
        mut(s2=>({gems:s2.gems+reward,mgScore:s2.mgScore+reward,mgStreak:s2.mgStreak+1,mgPlaysToday:s2.mgPlaysToday+1,mgIdx:s2.mgIdx+1}));
        setMgFb('✅ ถูกต้อง! +'+reward+'G ⭐ (เล่นไป '+(s.mgPlaysToday+1)+'/5 รอบ)');setMgFbColor('#1D9E75');
        if(s.mgPlaysToday+1>=5)setTimeout(()=>{setMgFb('🎉 ครบ 5 รอบแล้ว กลับมาพรุ่งนี้!');}	,2000);
        else setTimeout(loadMGFn,1500);
      }else{
        const count=s.mgSel.filter((v,i)=>v===s.mgAns[i]).length;
        if(count>0){let reward=5;if(s.mgScore+reward>100)reward=100-s.mgScore;mut(s2=>({gems:s2.gems+reward,mgScore:s2.mgScore+reward,mgStreak:0,mgPlaysToday:s2.mgPlaysToday+1}));setMgFb('ถูก '+count+'/'+s.mgAns.length+' — +'+5+'G');setMgFbColor('#F5C518');}
        else{mut(s2=>({mgStreak:0,mgPlaysToday:s2.mgPlaysToday+1}));setMgFb('❌ ผิด ('+( s.mgPlaysToday+1)+'/5 รอบ)');setMgFbColor('#E24B4A');}
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    /* SHOP */
    const buyHeart=useCallback(()=>{
      const ch=getCh();
      if(sRef.current.hp>=ch.hp){Swal.fire({icon:'info',title:'หัวใจเต็มแล้ว'});return;}
      if(sRef.current.gems<100){Swal.fire({icon:'error',title:'Gems ไม่พอ',text:'ต้องการ 100G'});return;}
      mut(s=>({gems:s.gems-100,hp:Math.min(ch.hp,s.hp+1),heartRegenTime:null}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);
    const buyChar=useCallback((id:string)=>{
      const ch=CHARS.find(c=>c.id===id);if(!ch)return;
      const s=sRef.current;if(ch.price>0&&s.gems<ch.price){Swal.fire({icon:'error',title:'Gems ไม่พอ',text:'ต้องการ '+ch.price+'G'});return;}
      mut(s2=>{
        const wasOwned=s2.ownedChars.includes(id);
        const owned=[...s2.ownedChars];
        if(!wasOwned)owned.push(id);
        const nextMaxHp=ch.hp;
        const nextHp=wasOwned?Math.min(s2.hp,nextMaxHp):nextMaxHp;
        return{
          gems:!wasOwned&&ch.price>0?s2.gems-ch.price:s2.gems,
          ownedChars:owned,
          selectedChar:id,
          hp:nextHp,
          maxHp:nextMaxHp,
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);
    const selChar=useCallback((id:string)=>{
      const ch=CHARS.find(c=>c.id===id)||CHARS[0];
      mut(s=>({selectedChar:id,maxHp:ch.hp,hp:Math.min(s.hp,ch.hp)}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const lv=LEVELS[S.worldIdx*4+S.stageIdx]||null;
    const ch=CHARS.find(c=>c.id===S.selectedChar)||CHARS[0];
    const unlockedBadges=BADGES.filter(b=>{const prog=b.id==='gem'?S.gems:S.bp[b.stat]||0;return prog>=(b.id==='gem'?500:b.threshold);}).length;

    /* ════ HERO CANVAS — FIX: always redraw on screen change ════ */
    const heroCanvasRef=useAnimCanvas((ctx,w,h,t)=>{
      const curCh=getCh();
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle='#050515';ctx.fillRect(0,0,w,h);
      bgStarsInit.forEach(s=>{const a=.2+.6*Math.abs(Math.sin(t*.005+s.ph));ctx.fillStyle='rgba(200,210,255,'+a.toFixed(2)+')';ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r,0,Math.PI*2);ctx.fill();});
      /* soft "planet / nebula" blobs (match ref banner) */
      ctx.fillStyle='rgba(60,55,120,.35)';ctx.beginPath();ctx.ellipse(w*.25,h*.42,w*.18,h*.22,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(30,70,65,.35)';ctx.beginPath();ctx.ellipse(w*.55,h*.32,w*.22,h*.28,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(90,55,40,.35)';ctx.beginPath();ctx.ellipse(w*.82,h*.46,w*.18,h*.24,0,0,Math.PI*2);ctx.fill();
      /* shooting star */
      const ss=((t*.002)%1);const sx=ss*w*1.4-w*.2,sy=ss*h*.5;const sa=Math.max(0,1-ss*1.2);ctx.strokeStyle='rgba(180,200,255,'+sa+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx-40,sy-20);ctx.stroke();
      /* char drawn on RIGHT side, text on LEFT */
      const orb=t*.018;
      const charX=w*.77+Math.cos(orb)*26,charY=h*.58+Math.sin(orb*1.1)*16;
      /* glow */
      const cga=.08+.05*Math.sin(t*.04);ctx.fillStyle=hexToRgba(curCh.color,cga);ctx.beginPath();ctx.arc(charX,charY-10,44,0,Math.PI*2);ctx.fill();
      drawShopCharById(ctx,charX,charY,curCh.id,curCh.color,curCh.color2,t*.9);
      /* char name below */
      ctx.font='bold 11px Orbitron,sans-serif';ctx.textAlign='center';ctx.fillStyle=curCh.color;
      ctx.fillText(curCh.name,charX,charY+36);ctx.textAlign='left';
    },[screen,S.selectedChar]);/* re-init when screen changes back to home */

    /* DAILY canvas */
    const dailyCanvasRef=useAnimCanvas((ctx,w,h,t)=>{
      ctx.clearRect(0,0,w,h);
      const grad=ctx.createLinearGradient(0,0,w,h);
      grad.addColorStop(0,'#090b2a');
      grad.addColorStop(.5,'#1a1140');
      grad.addColorStop(1,'#07162b');
      ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
      /* moving gradient rings */
      for(let ri=0;ri<3;ri++){const r=80+ri*30,a=.05+.03*Math.sin(t*.008+ri*1.2);ctx.strokeStyle='rgba(245,197,24,'+a+')';ctx.lineWidth=r*.15;ctx.beginPath();ctx.arc(w*.5+(Math.sin(t*.003+ri)*w*.2),h*.5+(Math.cos(t*.004+ri)*h*.15),r,0,Math.PI*2);ctx.stroke();}
      /* star field */
      bgStarsInit.forEach(s=>{const a=.15+.5*Math.abs(Math.sin(t*.005+s.ph));ctx.fillStyle='rgba(245,197,24,'+a.toFixed(2)+')';ctx.beginPath();ctx.arc(s.x*w,s.y*h,s.r*.8,0,Math.PI*2);ctx.fill();});
      /* 3 shooting streaks */
      for(let si=0;si<3;si++){const ss=((t*.003+si*.33)%1);const sx=ss*w*1.3-w*.15,sy=ss*h*.6;const a=Math.max(0,1-ss*1.2);ctx.strokeStyle='rgba(255,220,100,'+a+')';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx-30,sy-15);ctx.stroke();ctx.fillStyle='rgba(255,220,100,'+a+')';ctx.beginPath();ctx.arc(sx,sy,2,0,Math.PI*2);ctx.fill();}
      /* center glow */
      const cg=.08+.04*Math.sin(t*.01);ctx.fillStyle='rgba(245,197,24,'+cg+')';ctx.beginPath();ctx.ellipse(w*.5,h*.5,w*.3,h*.35,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(127,119,221,.18)';ctx.beginPath();ctx.ellipse(w*.75,h*.2,w*.2,h*.2,0,0,Math.PI*2);ctx.fill();
    },[screen]);

    /* MG banner */
    const mgBannerRef=useAnimCanvas((ctx,w,h,t)=>{
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle='#080820';ctx.fillRect(0,0,w,h);
      /* grid */
      ctx.strokeStyle='rgba(127,119,221,.07)';ctx.lineWidth=1;
      for(let gx=0;gx<w;gx+=30){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,h);ctx.stroke();}
      for(let gy=0;gy<h;gy+=30){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(w,gy);ctx.stroke();}
      /* floating code keyword blocks — PROMINENT */
      const blocks2=[
        {label:'IF',color:'#534AB7',tx:.1,speed:.0012},
        {label:'ELSE',color:'#3C3489',tx:.28,speed:.0009},
        {label:'LOOP',color:'#0F6E56',tx:.46,speed:.0014},
        {label:'หยุด',color:'#791F1F',tx:.64,speed:.0010},
        {label:'เดิน',color:'#185FA5',tx:.80,speed:.0011},
        {label:'โจมตี',color:'#854F0B',tx:.92,speed:.0013},
      ];
      ctx.font='bold 12px Noto Sans Thai, sans-serif';
      blocks2.forEach(b=>{
        const bx=((b.tx+t*b.speed)%1.3)*w-w*.15;
        const by=h*.22+Math.abs((b.tx*7+t*.03)%1)*h*.56;
        const ba=.5+.4*Math.sin(t*.05+b.tx*8);
        const tw=ctx.measureText(b.label).width+22;
        ctx.save();ctx.globalAlpha=ba;
        ctx.fillStyle=b.color;drawRR(ctx,bx-tw/2,by-14,tw,28,8);ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;drawRR(ctx,bx-tw/2,by-14,tw,28,8);ctx.stroke();
        /* glow */
        ctx.shadowColor=b.color;ctx.shadowBlur=12;
        ctx.fillStyle='rgba(255,255,255,.92)';ctx.textAlign='center';ctx.fillText(b.label,bx,by+4);
        ctx.shadowBlur=0;ctx.textAlign='left';ctx.restore();
        /* sparkle on some */
        if(t%25===Math.round(b.tx*100)%25){ctx.fillStyle='rgba(255,255,200,.8)';ctx.beginPath();ctx.arc(bx+tw/2-5,by-12,2,0,Math.PI*2);ctx.fill();}
      });
    },[screen]);

    const HeartSVG:React.FC<{full:boolean}>=({full})=>(
      <svg className="w-[18px] h-4" viewBox="0 0 18 16">
        <path d="M9 14C9 14 1 9 1 4.5A3.5 3.5 0 019 4 3.5 3.5 0 0117 4.5C17 9 9 14 9 14Z" fill={full?'#E24B4A':'rgba(226,75,74,.2)'}/>
      </svg>
    );

    const navItems=[
      {id:'home',label:'หน้าหลัก'},{id:'daily',label:'Daily'},
      {id:'worlds',label:'Worlds'},{id:'game',label:'เกม'},
      {id:'minigame',label:'Mini-Game'},{id:'badges',label:'Badges'},{id:'shop',label:'ร้านค้า'},
    ];

    const S_now=S;

    return(
      <div className="relative mx-auto p-3" style={{fontFamily:"'Noto Sans Thai', sans-serif",background:'#07071a',color:'#e8e4ff',minHeight:'100vh'}}>
        <style dangerouslySetInnerHTML={{__html:INJECTED_CSS}}/>

        {/* TOPBAR */}
        <div className="flex items-center gap-2 rounded-[14px] px-4 py-2.5 mb-3" style={{background:'rgba(7,7,26,0.96)',border:'1px solid rgba(127,119,221,0.22)'}}>
          <div className="flex-1 font-black tracking-widest text-sm" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>LOGIC QUEST</div>
          <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{background:'rgba(127,119,221,.1)',border:'0.5px solid rgba(127,119,221,.22)'}}>⭐ {S_now.gems}G</div>
          <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{background:'rgba(245,197,24,.10)',border:'0.5px solid rgba(245,197,24,.35)',color:'#F5C518'}}>💡 {S_now.hints}</div>
          <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{background:'rgba(127,119,221,.1)',border:'0.5px solid rgba(127,119,221,.22)'}}>🔥 {S_now.streak}</div>
          <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{background:'rgba(127,119,221,.1)',border:'0.5px solid rgba(127,119,221,.22)'}}>❤️ {S_now.hp}</div>
          {S_now.hp<S_now.maxHp&&S_now.heartRegenTime&&(
            <div className="text-[10px] px-2 py-1 rounded-full" style={{background:'rgba(226,75,74,.1)',border:'0.5px solid rgba(226,75,74,.4)',color:'#F09595'}}>
              +1❤️ {Math.max(0,Math.ceil((S_now.heartRegenTime-Date.now())/1000))}s
            </div>
          )}
                <div style={{ position: 'absolute', top: 16, right: 1000, zIndex: 20 }}>
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            title={isMuted ? "เปิดเสียง" : "ปิดเสียง"}
            style={{
              background: "rgba(0,0,0,0.55)",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.25rem 0.6rem",
              color: "#fff",
              fontSize: "1.3rem",
              cursor: "pointer",
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {isMuted ? "🔕" : "🔔"}
          </button>
        </div>
        </div>

        {/* NAV */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>goScreen(n.id)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-150"
              style={{border:'1px solid '+(screen===n.id?'#7F77DD':'rgba(127,119,221,.22)'),background:screen===n.id?'#534AB7':'transparent',color:screen===n.id?'#fff':'#9490c0',fontFamily:"'Noto Sans Thai', sans-serif"}}>
              {n.label}
            </button>
          ))}
          <button onClick={()=>goScreen('guide')} className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer" style={{background:'rgba(127,119,221,.1)',border:'1px solid rgba(127,119,221,.35)',color:'#AFA9EC'}}>📖 คู่มือ</button>
          <button onClick={()=>goScreen('guide-logic')} className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer" style={{background:'rgba(127,119,221,.1)',border:'1px solid rgba(127,119,221,.35)',color:'#AFA9EC',textShadow:'0.45px 0 0 rgba(255,90,90,0.38), -0.45px 0 0 rgba(70,130,255,0.38)'}}>🧠 คู่มือ Logic</button>
        </div>

        {/* ══ HOME ══ */}
        {screen==='home'&&(
          <div>
            {/* Hero — LANDSCAPE: char right, text left, no overlap */}
            <div className="relative rounded-[18px] overflow-hidden mb-3" style={{border:'1px solid rgba(127,119,221,.48)',height:'220px',boxShadow:'0 0 28px rgba(127,119,221,.18)'}}>
              <canvas ref={heroCanvasRef} className="absolute inset-0 w-full h-full"/>
              {/* left-side overlay gradient so text is readable */}
              <div className="absolute inset-0" style={{background:'linear-gradient(90deg,rgba(7,7,26,.92) 0%,rgba(7,7,26,.65) 45%,transparent 70%)'}}/>
              {/* text anchored LEFT — leaves right 30%+ for canvas character */}
              <div className="absolute inset-0 flex flex-col justify-center" style={{paddingLeft:'22px',paddingRight:'38%'}}>
                <h1 className="font-black leading-tight text-white" style={{fontFamily:"'Orbitron', monospace",fontSize:'clamp(18px,4vw,26px)',textShadow:'0 2px 20px rgba(127,119,221,.9)'}}>LOGIC<br/>QUEST</h1>
                <div className="text-[11px] mt-1.5 tracking-wider" style={{color:'#AFA9EC'}}>เรียนรู้ Logic ผ่านการผจญภัย</div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button onClick={()=>goScreen('worlds')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium cursor-pointer text-white" style={{background:'#534AB7',border:'1px solid #7F77DD'}}>▶ เล่นเลย</button>
                  <button onClick={()=>goScreen('daily')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium cursor-pointer" style={{background:'rgba(245,197,24,.12)',border:'1px solid #D4A017',color:'#F5C518'}}>⭐ Daily</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[{val:S_now.gems,lbl:'Gems',c:'#F5C518'},{val:S_now.hp,lbl:'HP',c:'#E24B4A'},{val:unlockedBadges,lbl:'Badges',c:'#AFA9EC'}].map((item,i)=>(
                <div key={i} className="text-center p-3 rounded-xl" style={{background:'rgba(13,13,43,.9)',border:'1px solid rgba(127,119,221,.22)'}}>
                  <div className="text-xl font-bold" style={{fontFamily:"'Orbitron', monospace",color:item.c}}>{item.val}</div>
                  <div className="text-[11px] mt-0.5" style={{color:'#9490c0'}}>{item.lbl}</div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl mb-3" style={{background:'rgba(127,119,221,.05)',border:'1px solid rgba(127,119,221,.22)'}}>
              <div className="flex justify-between items-center mb-2"><span className="text-[13px] font-medium">🔥 Streak</span><span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{background:'rgba(127,119,221,.18)',color:'#AFA9EC',border:'0.5px solid #534AB7'}}>{S_now.streak}/7 วัน</span></div>
              <div className="flex gap-1.5 flex-wrap">
                {[1,2,3,4,5,6,7].map(i=>(
                  <div key={i} className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{fontFamily:"'Orbitron', monospace",borderWidth:'1.5px',borderStyle:'solid',...(i<S_now.streak?{background:'rgba(29,158,117,.22)',borderColor:'#1D9E75',color:'#5DCAA5'}:i===S_now.streak?{borderColor:'#7F77DD',color:'#AFA9EC',boxShadow:'0 0 12px rgba(127,119,221,.4)',background:'rgba(127,119,221,.12)'}:i===7?{borderColor:'#F5C518',color:'#F5C518',background:'rgba(245,197,24,.07)'}:{borderColor:'rgba(127,119,221,.22)',color:'#5a5880'})}}>{i}</div>
                ))}
              </div>
            </div>

            <div className="rounded-[14px] p-3.5 mb-2.5" style={{background:'rgba(13,13,43,0.85)',border:'1px solid rgba(127,119,221,.22)'}}>
              <div className="text-[10px] tracking-widest mb-2" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>THE STORY</div>
              <p className="text-[13px] leading-relaxed" style={{color:'#9490c0'}}>บอส <span style={{color:'#E24B4A'}}>GLITCH</span> ขโมย Crystal of Logic ไป — หุ่นยนต์ <span style={{color:'#AFA9EC'}}>Byte</span> ต้องผ่าน 5 โลก ฝึก Logic Programming ไปพร้อมกัน!</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-[14px] p-3.5 cursor-pointer hover:-translate-y-0.5 transition-transform" style={{background:'rgba(13,13,43,0.85)',border:'1px solid rgba(127,119,221,.22)'}} onClick={()=>goScreen('shop')}>
                <div className="text-lg mb-1" style={{color:ch.color}}>{ch.icon}</div>
                <div className="text-[13px] font-medium">{ch.name}</div>
                <div className="text-[11px] mt-1" style={{color:'#AFA9EC'}}>เปลี่ยนตัวละคร →</div>
              </div>
              <div className="rounded-[14px] p-3.5 cursor-pointer hover:-translate-y-0.5 transition-transform" style={{background:'rgba(13,13,43,0.85)',border:'1px solid rgba(127,119,221,.22)'}} onClick={()=>{goScreen('minigame');}}>
                <div className="text-lg mb-1">🧩</div>
                <div className="text-[13px] font-medium">Mini-Game</div>
                <div className="text-[11px] mt-1" style={{color:'#F5C518'}}>+20G ต่อครั้ง →</div>
              </div>
            </div>
          </div>
        )}

        {/* ══ DAILY ══ */}
        {screen==='daily'&&(
          <div>
            {/* Animated banner */}
            <div className="relative rounded-2xl overflow-hidden mb-4 flex items-center justify-center" style={{border:'1px solid rgba(127,119,221,.48)',height:'140px'}}>
              <canvas ref={dailyCanvasRef} className="absolute inset-0 w-full h-full"/>
              {/* simple streak/login FX */}
              <div key={dailyFx} className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(circle at 50% 50%, rgba(245,197,24,.16), transparent 60%)',animation:'badgePulse .7s ease-out 1',opacity:.55}}/>
              <div className="text-center pointer-events-none relative z-10 px-4">
                <div className="text-xl font-black tracking-widest text-white mb-1" style={{fontFamily:"'Orbitron', monospace",textShadow:'0 0 24px rgba(245,197,24,.9)'}}>DAILY LOGIN</div>
                <div className="text-xs" style={{color:'#FAC775'}}>สะสม streak 7 วัน รับรางวัลสูงสุด!</div>
              </div>
            </div>

            {/* Login for 1 hint */}
            <div className="flex gap-2 flex-wrap mb-3">
              {/* <button onClick={loginAndGrantHint} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-sm font-medium cursor-pointer"
                style={{background:S_now.loggedIn?'rgba(29,158,117,.08)':'rgba(245,197,24,.12)',border:'1px solid '+(S_now.loggedIn?'#1D9E75':'#D4A017'),color:S_now.loggedIn?'#5DCAA5':'#F5C518'}}>
                {S_now.loggedIn?'✅ ล็อคอินแล้ว':'🔐 ล็อคอินรับ 1 Hint'}
              </button> */}
              <div className="text-xs px-3 py-2 rounded-[10px]" style={{background:'rgba(7,7,26,.6)',border:'1px solid rgba(127,119,221,.22)',color:'#9490c0'}}>
                Hint คงเหลือ: <span style={{color:'#F5C518',fontFamily:"'Orbitron', monospace"}}>{S_now.hints}</span> · ใช้ Hint ในด่านจะเสีย <span style={{color:'#E24B4A'}}>-1 ❤️</span>
              </div>
            </div>

            {/* Day cards */}
            <div className="flex gap-2 justify-center flex-wrap mb-4">
              {DREW.map((r,i)=>{
                const day=i+1,done=day<S_now.streak,today=day===S_now.streak&&!S_now.claimed,big=day===7;
                return(
                  <div key={i} className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105">
                    <div className="rounded-[14px] text-center overflow-hidden" style={{width:'76px',background:done?'rgba(29,158,117,.12)':today?'rgba(127,119,221,.14)':big?'rgba(245,197,24,.08)':'rgba(13,13,43,.8)',border:'1.5px solid '+(done?'#1D9E75':today?'#7F77DD':big?'#F5C518':'rgba(127,119,221,.22)'),boxShadow:today?'0 0 20px rgba(127,119,221,.3)':big?'0 0 16px rgba(245,197,24,.2)':'none'}}>
                      <div className="py-2 text-xl">{done?'✅':r.icon}</div>
                      <div className="font-bold text-base pb-1" style={{fontFamily:"'Orbitron', monospace",color:done?'#5DCAA5':today?'#AFA9EC':big?'#F5C518':'#e8e4ff'}}>{day}</div>
                      <div className="text-[10px] pb-2 leading-tight px-1" style={{color:'#9490c0'}}>{r.l}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 flex-wrap mb-4">
              <button onClick={claimDaily} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-sm font-medium cursor-pointer text-white" style={{background:'#534AB7',border:'1px solid #7F77DD'}}>
                {S_now.claimed?'รับแล้ว ✓':'✨ รับรางวัลวันนี้'}
              </button>
              {/* <button onClick={missDaily} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-medium cursor-pointer" style={{background:'rgba(127,119,221,.07)',border:'1px solid rgba(127,119,221,.22)',color:'#9490c0'}}>จำลอง: ขาดวัน</button> */}
            </div>

            {/* Bonus tip — styled nicely */}
            <div className="relative rounded-2xl overflow-hidden p-4" style={{background:'linear-gradient(135deg,rgba(127,119,221,.08),rgba(29,158,117,.06))',border:'1px solid rgba(127,119,221,.3)'}}>
              <div className="absolute top-3 right-4 text-3xl opacity-20" style={{animation:'floatY 3s ease-in-out infinite'}}>💡</div>
              <div className="text-[10px] tracking-widest font-bold mb-2" style={{fontFamily:"'Orbitron', monospace",color:'#F5C518'}}>BONUS TIP</div>
              <p className="text-xs leading-relaxed mb-3" style={{color:'#9490c0'}}>ขาด streak ไม่ต้องเสียใจ! ยังเล่น Mini-Game ได้สูงสุด <span style={{color:'#F5C518'}}>100G ต่อวัน</span> (5 รอบ) ✨</p>
              <button onClick={()=>goScreen('minigame')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium cursor-pointer" style={{background:'rgba(127,119,221,.12)',border:'1px solid rgba(127,119,221,.35)',color:'#AFA9EC'}}>ไป Mini-Game →</button>
            </div>
          </div>
        )}

        {/* ══ WORLDS ══ */}
        {screen==='worlds'&&(
          <div>
            <div className="text-[10px] tracking-widest mb-3" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>SELECT WORLD</div>
            {WORLDS.map((w,wi)=>{
              const totalStars=S_now.worldProgress[wi].reduce((a,b)=>a+(b||0),0);
              const done=S_now.worldProgress[wi].filter(x=>x>0).length;
              const pct=Math.round(Math.min(1,totalStars/12)*100);
              const locked=wi>0&&S_now.worldProgress[wi-1][3]===0;
              return <WorldCard key={wi} world={w} wi={wi} done={done} pct={pct} totalStars={totalStars} locked={locked} onClick={()=>{if(locked)return;mut(()=>({worldIdx:wi,stageIdx:0}));goScreen('stage');}}/>;
            })}
          </div>
        )}

        {/* ══ STAGE ══ */}
        {screen==='stage'&&(
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <button onClick={()=>goScreen('worlds')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-xs font-medium cursor-pointer" style={{background:'rgba(127,119,221,.07)',border:'1px solid rgba(127,119,221,.22)',color:'#9490c0'}}>← กลับ</button>
              <div className="flex-1 text-[11px]" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>{WORLDS[S_now.worldIdx]?.name.toUpperCase()}</div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2.5">
              {[0,1,2,3].map(si=>{
                const lv2=LEVELS[S_now.worldIdx*4+si];if(!lv2)return null;
                const stars=S_now.worldProgress[S_now.worldIdx][si]||0;
                const locked=si>0&&S_now.worldProgress[S_now.worldIdx][si-1]===0;
                return(
                  <div key={si} onClick={()=>!locked&&startStage(si)}
                    className="aspect-square rounded-[14px] flex flex-col items-center justify-center gap-1 font-bold text-[15px] transition-all duration-200"
                    style={{fontFamily:"'Orbitron', monospace",opacity:locked?.3:1,border:'1px solid '+(lv2.boss?'#F5C518':stars>0?'#1D9E75':'rgba(127,119,221,.22)'),background:lv2.boss?'rgba(245,197,24,.05)':stars>0?'rgba(29,158,117,.08)':'rgba(13,13,43,.7)',color:lv2.boss?'#F5C518':stars>0?'#5DCAA5':'#9490c0',cursor:locked?'not-allowed':'pointer'}}>
                    {lv2.boss?'👾':<span>{si+1}</span>}
                    <div className="flex gap-0.5 text-[9px]">{[1,2,3].map(ss=><span key={ss}>{ss<=stars?'★':'☆'}</span>)}</div>
                    <span className="text-[9px] text-center leading-tight px-1" style={{color:'#9490c0'}}>{locked?'🔒':lv2.boss?'BOSS':lv2.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ GAME ══ */}
        {screen==='game'&&lv&&(
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <button onClick={()=>goScreen('stage')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-xs font-medium cursor-pointer" style={{background:'rgba(127,119,221,.07)',border:'1px solid rgba(127,119,221,.22)',color:'#9490c0'}}>← Stages</button>
              <div className="flex-1 text-[11px] tracking-wider" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>W{S_now.worldIdx+1} — {lv.boss?'BOSS':'D'+(S_now.stageIdx+1)}</div>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={lv.boss?{background:'rgba(226,75,74,.15)',color:'#F09595',border:'0.5px solid #A32D2D'}:{background:'rgba(127,119,221,.18)',color:'#AFA9EC',border:'0.5px solid #534AB7'}}>{lv.skill}</span>
            </div>

            {/* LANDSCAPE CANVAS CONTAINER */}
            <div className="rounded-[14px] overflow-hidden mb-2.5 relative" style={{border:'1px solid '+(lv.boss?'rgba(226,75,74,.6)':'rgba(127,119,221,.28)')}}>
              <canvas ref={canvasRef} height={280} className="block w-full"/>
              <div className="absolute top-0 left-0 right-0 flex items-center gap-2 py-2 px-3" style={{background:'rgba(7,7,26,.85)',borderBottom:'1px solid rgba(127,119,221,.22)'}}>
                <div className="flex-1 text-[11px] font-bold tracking-wider" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>{lv.name}</div>
                <div className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full" style={{background:'rgba(127,119,221,.1)',border:'0.5px solid rgba(127,119,221,.22)'}}>⭐ {S_now.gems}G</div>
                <div className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full" style={{background:'rgba(245,197,24,.10)',border:'0.5px solid rgba(245,197,24,.30)',color:'#F5C518'}}>💡 {S_now.hints}</div>
                <div className="flex gap-0.5">{Array.from({length:S_now.maxHp}).map((_,i)=><HeartSVG key={i} full={i<S_now.hp}/>)}</div>
              </div>
            </div>

            {/* LANDSCAPE LAYOUT: palette left, code area right on wide screens */}
            <div className="mb-2">
              <div className="text-[10px] tracking-widest mb-1.5" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>MISSION</div>
              <div className="rounded-[14px] p-2.5 px-3.5 text-[13px] leading-relaxed" style={{background:'rgba(13,13,43,0.85)',border:'1px solid rgba(127,119,221,.22)',color:'#9490c0'}}>{lv.mission}</div>
            </div>

            <div className="grid gap-2" style={{gridTemplateColumns:'minmax(0,1fr)'}}>
              <div>
                <div className="text-[10px] tracking-widest mb-1.5" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>BLOCK PALETTE</div>
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl mb-2 min-h-[44px]" style={{background:'rgba(7,7,26,.6)',border:'1px solid rgba(127,119,221,.22)'}}>
                  {(palOrder.length?palOrder:lv.pal).map((b,i)=>{const cls=getBlkCls(b);return(
                    <div key={i} onClick={()=>{if(S_now.code.length<9&&!S_now.running)mut(s=>({code:[...s.code,b]}));}}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer select-none hover:-translate-y-0.5 hover:brightness-115 active:scale-95 transition-all"
                      style={{...getBlkStyle(cls),fontFamily:"'Noto Sans Thai', sans-serif"}}>{b}</div>
                  );})}
                </div>
              </div>
              <div>
                <div className="text-[10px] tracking-widest mb-1.5" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>CODE AREA <span className="text-[9px] font-normal" style={{color:'#5a5880',fontFamily:"'Noto Sans Thai', sans-serif"}}>— คลิก block เพื่อลบ</span></div>
                <div className="min-h-[60px] p-2 rounded-[10px] flex flex-wrap gap-1.5 items-start mb-2" style={{border:'1.5px dashed rgba(127,119,221,.28)',background:'rgba(7,7,26,.4)'}}>
                  {S_now.code.length===0?<span className="text-xs" style={{color:'#5a5880'}}>เพิ่ม block จาก palette...</span>:
                    S_now.code.map((b,i)=>{const cls=getBlkCls(b);return(
                      <div key={i} onClick={()=>{if(!S_now.running)mut(s=>({code:s.code.filter((_,idx)=>idx!==i)}));}}
                        className="relative pr-6 pl-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer hover:-translate-y-0.5 transition-transform"
                        style={{...getBlkStyle(cls),fontFamily:"'Noto Sans Thai', sans-serif"}}>
                        {b}<span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] text-white flex items-center justify-center" style={{background:'#E24B4A'}}>×</span>
                      </div>
                    );})}
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap mb-2">
              <button onClick={runCode} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium cursor-pointer text-white" style={{background:'#0F6E56',border:'1px solid #1D9E75'}}>▶ Run</button>
              <button onClick={clearCode} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium cursor-pointer" style={{background:'rgba(127,119,221,.07)',border:'1px solid rgba(127,119,221,.22)',color:'#9490c0'}}>ล้าง</button>
              <button
                onClick={useHint}
                disabled={S_now.running||S_now.hints<=0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{background:'rgba(245,197,24,.12)',border:'1px solid #D4A017',color:'#F5C518'}}>
                💡 Hint ({S_now.hints})
              </button>
            </div>

            {fbMsg&&<div className="min-h-[22px] text-xs p-1 px-2 rounded-md" style={{background:fbCls==='ok'?'rgba(29,158,117,.1)':fbCls==='err'?'rgba(226,75,74,.1)':'transparent',color:fbCls==='ok'?'#5DCAA5':fbCls==='err'?'#F09595':'#e8e4ff'}}>{fbMsg}</div>}
            {hintVisible&&lv&&<div className="mt-2 p-2.5 rounded-[10px] text-xs leading-relaxed" style={{background:'rgba(245,197,24,.05)',border:'1px solid #D4A017',color:'#F5C518'}}>💡 {lv.hint}</div>}

            {resultVisible&&(
              <div className="mt-2.5 p-4 text-center rounded-[14px]" style={{border:'1px solid '+(resultWin?'#1D9E75':'#E24B4A'),background:resultWin?'rgba(29,158,117,.08)':'rgba(226,75,74,.08)'}}>
                <div className="text-base font-medium mb-1.5" style={{color:resultWin?'#5DCAA5':'#F09595'}}>
                  {resultWin?(resultBoss?'🏆 BOSS ถูกเอาชนะแล้ว!':resultStars===3?'✨ 3 ดาว สมบูรณ์!':'✅ ผ่านด่านแล้ว!'):'💀 HP หมด!'}
                </div>
                <div className="flex justify-center gap-1.5 my-2.5">
                  {[1,2,3].map(i=><svg key={i} className="w-[30px] h-[30px]" viewBox="0 0 28 28"><polygon points="14,2 17,10 26,10 19,15.5 21.5,24 14,19 6.5,24 9,15.5 2,10 11,10" fill={i<=resultStars?'#F5C518':'rgba(255,255,255,.1)'}/></svg>)}
                </div>
                <div className="text-xs mb-3" style={{color:'#9490c0'}}>{resultWin?'รับ +'+resultReward+' Gems':'ต้องผ่านด่านนี้ก่อนถึงจะไปด่านถัดไปได้'}</div>
                {resultWin&&lv&&(
                  <div className="text-left mb-3 p-3 rounded-[12px]" style={{background:'rgba(7,7,26,.55)',border:'1px solid rgba(127,119,221,.22)'}}>
                    <div className="text-[11px] font-bold mb-2 tracking-wide" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>📚 โค้ดนี้ทำอะไรในเกม</div>
                    <p className="text-[10px] mb-2 leading-relaxed" style={{color:'#5a5880'}}>อธิบายตามลำดับบล็อกที่ถูกต้องของด่านนี้ — เทียบกับสิ่งที่เห็นบนแผนที่และเครื่องยนต์เกม</p>
                    <ol className="text-[11px] leading-relaxed pl-4 space-y-2 list-decimal" style={{color:'#9490c0'}}>
                      {getSolutionWalkthrough(lv).map((row,i)=>(
                        <li key={i}><span className="font-medium" style={{color:'#e8e4ff'}}>{row.code}</span> — {row.explain}</li>
                      ))}
                    </ol>
                  </div>
                )}
                <div className="flex items-center gap-2 w-full flex-wrap">
                  {resultWin&&<button onClick={nextStage} className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-[10px] text-xs font-medium cursor-pointer text-white flex-1 min-w-[140px]" style={{background:'#534AB7',border:'1px solid #7F77DD'}}>ด่านถัดไป →</button>}
                  <button onClick={retryStage} className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-[10px] text-xs font-medium cursor-pointer ml-auto" style={{background:'rgba(127,119,221,.07)',border:'1px solid rgba(127,119,221,.22)',color:'#9490c0',minWidth:'120px'}}>เล่นซ้ำ</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ MINI-GAME ══ */}
        {screen==='minigame'&&(()=>{
          const q=MG_Q[S_now.mgIdx%MG_Q.length];
          const opts=mgOptsOrder.length?mgOptsOrder:(q?[...q.blocks]:[]);
          return(
            <div>
              {/* Animated banner with floating blocks */}
              <div className="relative rounded-2xl overflow-hidden mb-3 flex items-center justify-center" style={{border:'1px solid rgba(127,119,221,.48)',height:'130px'}}>
                <canvas ref={mgBannerRef} className="absolute inset-0 w-full h-full"/>
                <div className="text-center pointer-events-none relative z-10">
                  <div className="text-base font-black tracking-widest text-white" style={{fontFamily:"'Orbitron', monospace",textShadow:'0 0 20px rgba(127,119,221,.9)'}}>BLOCK PUZZLE</div>
                  <div className="text-[11px] mt-1" style={{color:'#AFA9EC'}}>เรียง block ให้ถูกลำดับ รับ Gems!</div>
                  <div className="text-[11px] mt-1 font-bold" style={{color:'#F5C518'}}>{S_now.mgPlaysToday}/5 รอบ · {S_now.mgScore}G วันนี้</div>
                </div>
                <div className="absolute left-1/2 top-1/2 z-20 -translate-y-8 px-2 py-1 rounded-md text-[10px] font-bold pointer-events-none"
                  style={{background:'rgba(7,7,26,.85)',border:'1px solid rgba(127,119,221,.45)',color:'#AFA9EC',animation:'orbitTag 4.2s linear infinite'}}>
                  IF ELSE LOOP หยุด
                </div>
              </div>

              <div className="flex gap-2.5 mb-3">
                {[{label:'คะแนนวันนี้',value:S_now.mgScore,color:'#F5C518'},{label:'ถูกติดต่อกัน',value:S_now.mgStreak,color:'#1D9E75'},{label:'รอบที่',value:S_now.mgPlaysToday+'/5',color:'#AFA9EC'}].map((item,i)=>(
                  <div key={i} className="flex-1 text-center p-2.5 rounded-[10px]" style={{background:'rgba(13,13,43,.85)',border:'1px solid rgba(127,119,221,.22)'}}>
                    <div className="text-xl font-bold" style={{fontFamily:"'Orbitron', monospace",color:item.color}}>{item.value}</div>
                    <div className="text-[10px]" style={{color:'#9490c0'}}>{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-[14px] p-3.5 mb-2.5" style={{background:'rgba(13,13,43,0.85)',border:'1px solid rgba(127,119,221,.22)'}}>
                {S_now.mgPlaysToday>=5?<div className="text-sm font-medium p-2.5 rounded-lg text-center" style={{background:'rgba(127,119,221,.06)',borderLeft:'3px solid #7F77DD',color:'#AFA9EC'}}>🎮 ครบ 5 รอบแล้ว! กลับมาพรุ่งนี้</div>:(
                  <>
                    <div className="text-sm font-medium p-2.5 rounded-lg mb-3" style={{background:'rgba(127,119,221,.06)',borderLeft:'3px solid #7F77DD'}}>{q?.q||'โหลด...'}</div>
                    <div className="text-[11px] tracking-wider mb-1.5" style={{fontFamily:"'Orbitron', monospace",color:'#9490c0'}}>วางลำดับที่ถูก:</div>
                    <div className="flex gap-2 flex-wrap mb-3 min-h-[50px] p-2 rounded-[10px] items-center" style={{border:'1.5px dashed rgba(127,119,221,.22)'}}>
                      {S_now.mgAns.map((_,i)=>{const val=S_now.mgSel[i];return(
                        <div key={i} onClick={()=>{if(val)unselectMGSlot(i);}}
                          className="min-w-[90px] h-[42px] rounded-[9px] flex items-center justify-center text-xs p-1.5 cursor-pointer transition-all"
                          style={val?{border:'1.5px solid #7F77DD',background:'rgba(127,119,221,.12)',color:'#e8e4ff'}:{border:'1.5px dashed rgba(127,119,221,.32)',color:'#5a5880'}}>
                          {val||'— '+(i+1)+' —'}
                        </div>
                      );})}
                    </div>
                    <div className="text-[11px] tracking-wider mb-2" style={{fontFamily:"'Orbitron', monospace",color:'#9490c0'}}>เลือก block:</div>
                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {opts.map((o,i)=>{const used=S_now.mgSel.includes(o);return(
                        <div key={i} onClick={()=>{if(!used)selectMGOpt(o);}}
                          className="px-3.5 py-2 rounded-[9px] text-[13px] cursor-pointer transition-all"
                          style={{border:'1px solid rgba(127,119,221,.48)',background:used?'rgba(127,119,221,.03)':'rgba(127,119,221,.08)',color:used?'#5a5880':'#e8e4ff',opacity:used?.3:1,pointerEvents:used?'none':'auto',fontFamily:"'Noto Sans Thai', sans-serif"}}>
                          {o}
                        </div>
                      );})}
                    </div>
                  </>
                )}
                {mgFb&&<div className="text-xs min-h-[18px]" style={{color:mgFbColor}}>{mgFb}</div>}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={checkMG} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-xs font-medium cursor-pointer text-white" style={{background:'#534AB7',border:'1px solid #7F77DD'}}>✓ ตรวจคำตอบ</button>
                <button onClick={loadMGFn} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-xs font-medium cursor-pointer" style={{background:'rgba(127,119,221,.07)',border:'1px solid rgba(127,119,221,.22)',color:'#9490c0'}}>ข้อถัดไป →</button>
              </div>
            </div>
          );
        })()}

        {/* ══ BADGES — vibrant redesign ══ */}
        {screen==='badges'&&(
          <div>
            <div className="text-[10px] tracking-widest mb-1" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>BADGES &amp; ACHIEVEMENTS</div>
            <p className="text-xs mb-4" style={{color:'#9490c0'}}>สะสม badges จากทักษะที่พิสูจน์แล้ว — {unlockedBadges}/{BADGES.length} ปลดล็อกแล้ว</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-3">
              {BADGES.map(b=>{
                const prog=b.id==='gem'?S_now.gems:S_now.bp[b.stat]||0;
                const threshold=b.id==='gem'?500:b.threshold;
                const unlocked=prog>=threshold;
                const pct=Math.min(100,Math.round(prog/threshold*100));
                return(
                  <div key={b.id} className="rounded-2xl p-4 text-center relative overflow-hidden transition-all duration-300"
                    style={{border:'2px solid '+(unlocked?b.colors[2]:'rgba(90,88,128,.25)'),background:unlocked?b.colors[1]:'rgba(13,13,43,.7)',opacity:unlocked?1:.4,filter:unlocked?'none':'grayscale(.7)',transform:unlocked?'none':'scale(.97)',boxShadow:unlocked?'0 0 24px '+b.colors[2]+', inset 0 0 30px rgba(0,0,0,.3)':'none'}}>
                    {/* animated shimmer on unlocked */}
                    {unlocked&&<div className="absolute inset-0 overflow-hidden pointer-events-none"><div style={{position:'absolute',width:'60%',height:'200%',background:'rgba(255,255,255,.06)',transform:'rotate(45deg)',animation:'shimmer 3s ease-in-out infinite',top:'-50%',left:'-30%'}}/></div>}
                    {/* glow layer */}
                    {unlocked&&<div className="absolute inset-0 opacity-15 pointer-events-none" style={{background:'radial-gradient(ellipse 80% 60% at 50% 30%,'+b.colors[2]+',transparent)'}}/>}
                    <div className="relative z-10">
                      <div className="w-[62px] h-[62px] rounded-full flex items-center justify-center mx-auto mb-3 text-[28px] relative"
                        style={{background:unlocked?b.colors[1]:'rgba(90,88,128,.1)',border:'2px solid '+(unlocked?b.colors[0]:'rgba(90,88,128,.3)'),animation:unlocked?'badgePulse 2.5s ease-in-out infinite':undefined,['--bc' as string]:b.colors[0]}}>
                        {b.icon}
                        {unlocked&&<div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{background:b.colors[0],color:'#fff'}}>✓</div>}
                      </div>
                      <div className="text-[13px] font-medium mb-0.5" style={{color:unlocked?'#fff':'#9490c0'}}>{b.name}</div>
                      <div className="text-[11px] leading-snug mb-2.5" style={{color:unlocked?b.colors[2]:'#5a5880'}}>{b.desc}</div>
                      <div className="h-[6px] rounded-sm overflow-hidden mb-1.5" style={{background:'rgba(0,0,0,.3)'}}>
                        <div className="h-full rounded-sm transition-all duration-500" style={{width:pct+'%',background:b.colors[0],boxShadow:'0 0 8px '+b.colors[0]}}/>
                      </div>
                      <div className="text-[11px] font-medium" style={{color:unlocked?b.colors[0]:'#5a5880'}}>{unlocked?'✨ ปลดล็อกแล้ว!':prog+'/'+threshold}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ SHOP ══ */}
        {screen==='shop'&&(
          <div>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <div className="text-[10px] tracking-widest" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>SHOP</div>
              <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{background:'rgba(127,119,221,.1)',border:'0.5px solid rgba(127,119,221,.22)'}}>⭐ {S_now.gems} G</div>
            </div>
            <p className="text-xs mb-3.5" style={{color:'#9490c0'}}>ซื้อตัวละครและหัวใจ</p>

            {/* Heart shop */}
            <div className="relative mb-4 rounded-2xl overflow-hidden p-4" style={{border:'2px solid rgba(226,75,74,.5)',background:'linear-gradient(135deg,rgba(226,75,74,.1),rgba(216,90,48,.08))',boxShadow:'0 4px 24px rgba(226,75,74,.2)'}}>
              <div className="flex items-start gap-3">
                <div className="text-[36px]" style={{animation:'heartBeat 1.5s ease-in-out infinite',lineHeight:1}}>❤️</div>
                <div className="flex-1">
                  <div className="text-sm font-black tracking-widest mb-0.5" style={{fontFamily:"'Orbitron', monospace",color:'#E24B4A'}}>HEART SHOP</div>
                  <div className="text-xs mb-2" style={{color:'#9490c0'}}>หัวใจปัจจุบัน: {S_now.hp}/{ch.hp}</div>
                  <div className="flex gap-1 mb-2">{Array.from({length:ch.hp}).map((_,i)=><span key={i} className="text-xl" style={{filter:'drop-shadow(0 2px 4px rgba(0,0,0,.4))'}}>	{i<S_now.hp?'❤️':'🖤'}</span>)}</div>
                </div>
                <button onClick={buyHeart} className="px-4 py-2 rounded-[10px] text-xs font-semibold text-white cursor-pointer hover:scale-105 active:scale-95 transition-all whitespace-nowrap" style={{background:'linear-gradient(135deg,#E24B4A,#D85A30)',border:'none',boxShadow:'0 4px 14px rgba(226,75,74,.45)'}}>
                  ❤️ ซื้อ 100G
                </button>
              </div>
            </div>

            {/* Characters */}
            <div className="text-[10px] tracking-widest mb-2" style={{fontFamily:"'Orbitron', monospace",color:'#AFA9EC'}}>CHARACTERS</div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
              {CHARS.map(c2=>{
                const owned=S_now.ownedChars.includes(c2.id),sel=S_now.selectedChar===c2.id;
                const rc=RCOL[c2.rarity]||'#888';
                return(
                  <div key={c2.id} className="rounded-2xl p-4 text-center relative overflow-hidden transition-all duration-250 hover:-translate-y-0.5"
                    style={{background:sel?hexToRgba(rc,.06):'rgba(13,13,43,.85)',border:'1.5px solid '+(sel?rc:owned?'#1D9E75':'rgba(127,119,221,.22)'),boxShadow:sel?'0 0 28px '+rc+'55':'none'}}>
                    <div className="text-[10px] font-bold tracking-widest mb-1.5" style={{fontFamily:"'Orbitron', monospace",color:rc}}>{RARITY[c2.rarity]}</div>
                    {/* Canvas character — clipped properly */}
                    <ShopCharCanvas charData={c2}/>
                    <div className="text-sm font-medium mb-0.5">{c2.name}</div>
                    <div className="text-[11px] mb-2.5 leading-snug" style={{color:'#9490c0'}}>{c2.desc}</div>
                    <div className="text-left mb-2">
                      {[{label:'HP',val:c2.hp,max:10,color:'#E24B4A'},{label:'ATK',val:c2.atk,max:4,color:'#F5C518'},{label:'DEF',val:c2.shield,max:2,color:'#378ADD'}].map(st=>(
                        <div key={st.label} className="flex items-center gap-2 mb-1.5 text-xs">
                          <span className="w-6 text-[10px]" style={{color:'#9490c0'}}>{st.label}</span>
                          <div className="flex-1 h-1 rounded-sm overflow-hidden" style={{background:'rgba(127,119,221,.1)'}}>
                            <div className="h-full rounded-sm" style={{width:Math.round(st.val/st.max*100)+'%',background:st.color}}/>
                          </div>
                          <span className="text-[11px] min-w-[16px]">{st.val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] font-medium mb-1.5" style={{color:rc}}>⚡ {c2.skillName}</div>
                    {c2.price>0&&!owned&&<div className="font-bold mb-2" style={{fontFamily:"'Orbitron', monospace",fontSize:13,color:'#F5C518'}}>{c2.price} G</div>}
                    {sel?<div className="py-1.5 rounded-lg text-center text-xs" style={{background:'rgba(29,158,117,.15)',border:'1px solid #1D9E75',color:'#5DCAA5'}}>✓ กำลังใช้งาน</div>
                      :owned?<button onClick={()=>selChar(c2.id)} className="w-full py-1.5 rounded-lg text-xs font-medium cursor-pointer" style={{background:'rgba(127,119,221,.07)',border:'1px solid rgba(127,119,221,.22)',color:'#9490c0'}}>เลือกใช้งาน</button>
                      :<button onClick={()=>buyChar(c2.id)} className="w-full py-1.5 rounded-lg text-xs font-medium cursor-pointer" style={S_now.gems>=c2.price?{background:'rgba(245,197,24,.12)',border:'1px solid #D4A017',color:'#F5C518'}:{background:'rgba(127,119,221,.07)',border:'1px solid rgba(127,119,221,.22)',color:'#9490c0'}}>
                        {S_now.gems>=c2.price?'ซื้อ '+c2.price+' G':'ต้อง '+c2.price+' G'}
                      </button>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ GUIDE ══ */}
        {screen==='guide'&&(
          <div>
            <div className="text-sm font-black tracking-widest text-center text-white p-4 rounded-xl mb-3" style={{fontFamily:"'Orbitron', monospace",background:'linear-gradient(135deg,#534AB7,#0F6E56)'}}>📖 คู่มือการเล่นเกม</div>
            {[
              {title:'🎮 วิธีเล่น',color:'#AFA9EC',items:['เลือก World และ Stage ที่ต้องการเล่น','อ่าน Mission แล้วลาก Block จาก Palette มาวางใน Code Area','กด Run เพื่อรันโค้ด','ได้รับ Gems ตามจำนวนดาวที่ได้']},
              {title:'❤️ ระบบหัวใจ',color:'#E24B4A',border:'rgba(226,75,74,.3)',bg:'rgba(226,75,74,.05)',items:['ต้องมีหัวใจอย่างน้อย 1 ดวงถึงจะเล่นด่านได้','ตอบผิด 1 ครั้ง = เสียหัวใจ 1 ดวง','หัวใจหมด = ไม่ผ่านด่าน','ซื้อหัวใจได้ที่ร้านค้า 100G = 1 ❤️']},
              {title:'💡 ระบบ Hint',color:'#F5C518',border:'rgba(245,197,24,.3)',bg:'rgba(245,197,24,.05)',items:[
                'กดปุ่ม 💡 Hint ในด่านเพื่อดูคำใบ้',
                'การใช้ Hint จะเสีย: -1 Hint และ -1 ❤️ (ใช้ได้เมื่อ Hint > 0 และ HP มากกว่า 1)',
                'ถ้า Hint = 0 จะใช้ Hint ในด่านไม่ได้',
                'ถ้าใช้ Hint ในด่านนั้น จะไม่ได้ 3 ดาว (อย่างน้อยจะเหลือ 2 ดาว)',
                'ได้ Hint จาก: Daily (บางวัน) และล็อคอินครั้งแรก (รับ 1 Hint)'
              ]},
              {title:'⭐ ระบบดาว',color:'#F5C518',border:'rgba(245,197,24,.3)',bg:'rgba(245,197,24,.05)',items:[
                '3 ดาว = ผ่านโดยไม่ตอบผิดเลย + HP ต้องเต็ม + ไม่ใช้ Hint',
                '2 ดาว = ตอบผิด 1 ครั้ง หรือ HP ไม่เต็ม หรือใช้ Hint',
                '1 ดาว = ตอบผิด 2 ครั้งขึ้นไป หรือ HP เหลือใกล้หมด (เช่น 1)',
                '0 ดาว = HP หมด ไม่ผ่านด่าน',
                'หมายเหตุ: เล่นซ้ำแล้วได้ดาวน้อยกว่า ระบบจะไม่ทับให้แย่ลง'
              ]},
              {title:'🎁 รางวัล (Gems) ตามดาว',color:'#AFA9EC',items:[
                'ด่านปกติ: 0★=0G, 1★=8G, 2★=14G, 3★=20G',
                'ด่านบอส: โบนัสเพิ่มตามดาว: 0★=0G, 1★=+20G, 2★=+35G, 3★=+50G'
              ]},
              {title:'🧩 Mini-Game',color:'#1D9E75',items:['เล่นได้ 5 รอบต่อวัน สูงสุด 100G/วัน','รีเซ็ตทุกวัน']},
            ].map((section,i)=>(
              <div key={i} className="rounded-[14px] p-3.5 mb-3" style={{background:section.bg||'rgba(13,13,43,0.85)',border:'1px solid '+(section.border||'rgba(127,119,221,.22)')}}>
                <div className="text-[13px] font-medium mb-2" style={{color:section.color}}>{section.title}</div>
                <ul className="text-xs leading-relaxed pl-5 list-disc" style={{color:'#9490c0'}}>{section.items.map((item,j)=><li key={j}>{item}</li>)}</ul>
              </div>
            ))}

            {/* Characters guide — FIXED: clipped canvas, no overflow */}
            <div className="rounded-[14px] p-3.5 mb-3" style={{background:'rgba(13,13,43,0.85)',border:'1px solid rgba(127,119,221,.22)'}}>
              <div className="text-[13px] font-medium mb-3" style={{color:'#AFA9EC'}}>🤖 ตัวละครในเกม</div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
                {CHARS.map(c2=>(
                  <div key={c2.id} className="rounded-xl text-center overflow-hidden" style={{background:'rgba(7,7,26,.6)',border:'1px solid '+RCOL[c2.rarity]+'33'}}>
                    {/* Fixed-height canvas container — clips any overflow */}
                    <div style={{width:'100%',height:'90px',overflow:'hidden',position:'relative'}}>
                      <GuideCharCanvas charData={c2}/>
                    </div>
                    <div className="p-2">
                      <div className="text-[12px] font-medium mb-0.5" style={{color:RCOL[c2.rarity]}}>{c2.name}</div>
                      <div className="text-[10px]" style={{color:'#9490c0'}}>HP:{c2.hp} ATK:{c2.atk} DEF:{c2.shield}</div>
                      <div className="text-[10px] mt-0.5" style={{color:RCOL[c2.rarity]}}>⚡ {c2.skillName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {screen==='guide-logic'&&<LogicProgrammingGuide/>}

      </div>
    );
  };

  /* ════ WORLD CARD ════ */
  const WorldCard:React.FC<{world:World;wi:number;done:number;pct:number;totalStars:number;locked:boolean;onClick:()=>void}>=({world,wi,done,pct,totalStars,locked,onClick})=>{
    const wcRef=useRef<HTMLCanvasElement>(null);
    const wtRef=useRef(0);
    const waRef=useRef(0);
    const wsRef=useRef<{x:number;y:number;r:number;ph:number}[]>([]);
    useEffect(()=>{
      const stars:{x:number;y:number;r:number;ph:number}[]=[];
      const C=wcRef.current;if(!C)return;const pw=C.parentElement?.clientWidth||400;
      for(let i=0;i<30;i++)stars.push({x:Math.random()*pw,y:Math.random()*100,r:Math.random()*1.2+.3,ph:Math.random()*Math.PI*2});
      wsRef.current=stars;
      function loop(){
        wtRef.current++;const C2=wcRef.current;if(!C2)return;const ctx=C2.getContext('2d');if(!ctx)return;
        const p=C2.parentElement;if(p){C2.width=p.clientWidth;C2.height=p.clientHeight;}
        drawWorldMini(ctx,C2.width,C2.height,world.bg,wtRef.current,wsRef.current);
        waRef.current=requestAnimationFrame(loop);
      }
      waRef.current=requestAnimationFrame(loop);
      return()=>{if(waRef.current)cancelAnimationFrame(waRef.current);};
    },[world.bg]);
    const worldStars=Math.min(3,Math.floor(Math.min(12,totalStars)/4)); /* 0..3 */
    return(
      <div onClick={onClick} className="rounded-2xl overflow-hidden mb-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5" style={{border:'1px solid '+world.color+'44',opacity:locked?.45:1,cursor:locked?'not-allowed':'pointer'}}>
        <div className="h-[100px] relative overflow-hidden">
          <canvas ref={wcRef} className="absolute inset-0 w-full h-full"/>
          <div className="absolute inset-0" style={{background:'linear-gradient(90deg,rgba(7,7,26,.8) 0,rgba(7,7,26,.3) 60%,transparent)'}}/>
          <div className="absolute inset-0 flex items-center px-4 z-10">
            <div className="flex-1">
              <div className="font-black text-base text-white" style={{fontFamily:"'Orbitron', monospace",textShadow:'0 2px 16px rgba(0,0,0,.8)'}}>{world.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-0.5 text-[10px]" style={{color:'#F5C518'}}>
                  {[1,2,3].map(i=><span key={i}>{i<=worldStars?'★':'☆'}</span>)}
                </div>
                <div className="text-[10px]" style={{color:'#AFA9EC'}}>{Math.min(12,totalStars)}/12</div>
              </div>
            </div>
          </div>
          {locked&&<div className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full" style={{background:'rgba(226,75,74,.15)',border:'1px solid rgba(226,75,74,.45)',color:'#F09595'}}>🔒 ผ่านบอสโลกก่อนหน้า</div>}
        </div>
        <div className="p-2.5 px-4 flex items-center gap-3" style={{background:'rgba(13,13,43,.9)'}}>
          <div className="flex-1">
            <div className="text-[11px] mb-1.5" style={{color:'#9490c0'}}>{world.skill}</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 rounded-sm overflow-hidden" style={{background:'rgba(127,119,221,.1)'}}>
                <div className="h-full rounded-sm transition-all duration-500" style={{width:pct+'%',background:world.color}}/>
              </div>
              <span className="text-[11px]" style={{color:'#9490c0'}}>{done}/4</span>
            </div>
          </div>
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{background:world.color+'18',color:world.color,border:'0.5px solid '+world.color+'55'}}>{pct}%</span>
        </div>
      </div>
    );
  };

  /* ════ SHOP CHARACTER CANVAS — properly clipped ════ */
  const ShopCharCanvas:React.FC<{charData:Char;size?:number}>=({charData,size=160})=>{
    const ref=useRef<HTMLCanvasElement>(null);
    const tR=useRef(0);const aR=useRef(0);
    useEffect(()=>{
      function loop(){
        tR.current+=0.7;const C=ref.current;if(!C)return;
        const ctx=C.getContext('2d');if(!ctx)return;
        /* fixed canvas size — character must fit inside */
        C.width=size;C.height=size;
        ctx.clearRect(0,0,size,size);
        /* bg glow */
        const ga=.07+.04*Math.sin(tR.current*.04);ctx.fillStyle=hexToRgba(charData.color,ga);ctx.beginPath();ctx.arc(size/2,size/2+5,size*.38,0,Math.PI*2);ctx.fill();
        /* ground shadow */
        ctx.beginPath();ctx.ellipse(size/2,size*.88,size*.22,size*.05,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fill();
        /* character drawn centered, vertically positioned so crown/flames stay inside */
        const charY=size*.62;/* lower center so taller characters fit */
        /* clip to canvas bounds */
        ctx.save();ctx.beginPath();ctx.rect(0,0,size,size);ctx.clip();
        drawShopCharById(ctx,size/2,charY,charData.id,charData.color,charData.color2,tR.current);
        ctx.restore();
        aR.current=requestAnimationFrame(loop);
      }
      aR.current=requestAnimationFrame(loop);
      return()=>{if(aR.current)cancelAnimationFrame(aR.current);};
    },[charData.id,charData.color,charData.color2,size]);
    return<canvas ref={ref} width={size} height={size} className="mx-auto mb-2 block" style={{width:size+'px',height:size+'px'}}/>;
  };

  /* ════ GUIDE CHARACTER CANVAS — small, clipped ════ */
  const GuideCharCanvas:React.FC<{charData:Char}>=({charData})=>{
    const ref=useRef<HTMLCanvasElement>(null);
    const tR=useRef(0);const aR=useRef(0);
    const SIZE=90;
    useEffect(()=>{
      function loop(){
        tR.current++;const C=ref.current;if(!C)return;
        const ctx=C.getContext('2d');if(!ctx)return;
        C.width=SIZE;C.height=SIZE;
        ctx.clearRect(0,0,SIZE,SIZE);
        /* clip strictly */
        ctx.save();ctx.beginPath();ctx.rect(0,0,SIZE,SIZE);ctx.clip();
        /* character smaller scale via transform */
        ctx.save();ctx.translate(SIZE/2,SIZE*.62);ctx.scale(.55,.55);ctx.translate(-SIZE/2,-SIZE*.62);
        drawShopCharById(ctx,SIZE/2,SIZE*.62,charData.id,charData.color,charData.color2,tR.current);
        ctx.restore();ctx.restore();
        aR.current=requestAnimationFrame(loop);
      }
      aR.current=requestAnimationFrame(loop);
      return()=>{if(aR.current)cancelAnimationFrame(aR.current);};
    },[charData.id,charData.color,charData.color2]);
    /* fill parent height */
    return<canvas ref={ref} width={SIZE} height={SIZE} style={{display:'block',width:'100%',height:'100%',objectFit:'contain'}}/>;
  };
  export{JSLogic as JSLogic_3_2};


