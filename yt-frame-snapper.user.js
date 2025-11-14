// ==UserScript==
// @name         YouTube FrameSnapper/📸
// @namespace    https://k0ff.eu
// @description  Take snapshots from YouTube videos
// @author       KRZYSZTOF TYNKIEWICZ
// @match        https://*.youtube.com/*
// @version      0.1.0
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const selector = (
        ".ytp-right-controls-left"
    );

    function getVideoElement() {
        return document.querySelector(
            'video.video-stream.html5-main-video'
        );
    }

    function getVideoTitle() {
        const titleElement = document.querySelector(
            '#title.ytd-watch-metadata yt-formatted-string[title]'
        );
        return titleElement.title;
    }

    function getSVGIcon() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 256 195.8685');
        svg.setAttribute('fill-rule', 'evenodd');
        svg.setAttribute('clip-rule', 'evenodd');

        //
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('fill', '#ffffff');
        path.setAttribute('d',
            'm 94.9765,0 h 90.955 c 7.0635,0 10.232,6.2815 12.8425,12.8425 l 9.664,24.292 h 16.8285 ' +
            'C 242.17,37.1345 256,50.9655 256,67.868 v 97.267 c 0,16.9025 -13.831,30.7335 -30.7335,30.7335 ' +
            'H 30.7335 C 13.831,195.8685 0,182.0385 0,165.135 V 67.868 C 0,50.9645 13.83,37.1345 30.7335,37.1345 ' +
            'H 71.262 L 82.134,12.8425 C 85.0195,6.395 87.913,0 94.9765,0 Z ' +
            'm 38.3655,72.0925 c 20.555,0 37.2375,16.682 37.2375,37.238 0,20.555 -16.6815,37.2375 -37.2375,37.2375 ' +
            '-20.555,0 -37.2375,-16.6815 -37.2375,-37.2375 5e-4,-20.556 16.6825,-37.238 37.2375,-37.238 z ' +
            'M 221.375,57.785 c 6.7885,0 12.2865,5.498 12.2865,12.287 0,6.789 -5.498,12.287 -12.2865,12.287 ' +
            '-6.7895,0 -12.2875,-5.498 -12.2875,-12.287 0.0205,-6.789 5.519,-12.287 12.2875,-12.287 z ' +
            'm -88.033,-9.9335 c 33.968,0 61.4995,27.532 61.4995,61.4995 0,33.9465 -27.5325,61.4995 -61.4995,61.4995 ' +
            '-33.947,0 -61.4995,-27.553 -61.4995,-61.4995 C 71.863,75.3835 99.395,47.8515 133.342,47.8515 Z'
        );

        //
        svg.appendChild(path);
        return svg;
    }

    function getVideoId() {
        return (new URLSearchParams((new URL(location.href)).search)).get('v');
    }

    function convertToFileName(title) {
        const replacements = {
            ':': '∶', 
            '"': "″", 
            '/': '⁄',
            '\\': '∖',
            '*': '⁕',
            '?': '⁇',
            '<': '‹',
            '>': '›',
            '|': '∣'
        };

        return title.replace(
            // eslint-disable-next-line
            /[\\\/:*?"<>|\x00]/g,
            (char) => replacements[char] || ''
        );
    }

    async function waitForContainer() {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (!element) return;

                observer.disconnect();
                resolve(element);
            });

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        });
    }

    async function addSnapshotButton() {
        const container = await waitForContainer();

        //
        const btn = (() => {
            document.createElement("button");
            btn.className = "ytp-button ytp-snapshot-button";
            btn.title = "Snapshot";
            btn.draggable = false;
            return btn;
        })();

        //
        const svg = getSVGIcon();
        svg.style.width = '24px';
        svg.style.height = '24px';
        btn.appendChild(svg);

        //
        btn.addEventListener("click", () => {
            doSnapshot();
        });

        //
        container.insertBefore(btn, (
            container.querySelector('.ytp-settings-button') ||
            container.firstChild
        ));
    }

    function secondsToHMS(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
            
        if (h > 0) {
            return `${h}∶${
                    String(m).padStart(2, '0')}∶${
                    String(s).padStart(2, '0')
                }`;
        }

        return `${m}∶${
                String(s).padStart(2, '0')
            }`;
    }

    function doSnapshot() {
        const video = getVideoElement();
        if (!(video instanceof HTMLVideoElement)) {
            console.error('<video> not found');
            return;
        }

        //
        const canvas = (() => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, 
                canvas.width, 
                canvas.height
            );

            return canvas;    
        })();

        //
        const filename = (() => {
            const title = getVideoTitle();
            const id = getVideoId();
            const time = Math.floor(video.currentTime);
            const HMS = secondsToHMS(time);
            
            return `″${ convertToFileName(title) }″; {`+
                        `yt∶ ${ id }; `+
                        `t∶ ${ time }; `+
                        `(${ HMS })`+
                    `}; `+
                    `⁄snapshot`; 
        })();
        
        //
        canvas.toBlob(
            (blob) => {
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();

                URL.revokeObjectURL(url);
            }, 
            'image/png'
        );
    }

    addSnapshotButton();
})();
