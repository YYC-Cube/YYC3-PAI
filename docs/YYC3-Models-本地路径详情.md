# 模型资产总览

## 模型资产总览与部署建议

yanyu@yyc3-22 ~ % ls -l /Volumes/Max/models
total 15512
-rw-r--r--@  1 yanyu  staff   120303 May  5 14:20 chinese_taxonomy.png
drwxr-xr-x  22 yanyu  staff      704 Apr  2 01:59 Cogagent-9B
drwxr-xr-x  15 yanyu  staff      480 May  1 20:50 Cogvideox-5B
drwxr-xr-x@ 64 yanyu  staff     2048 May 15 11:19 DeepSeek-V4-Flash
-rw-r--r--   1 yanyu  staff    13360 May 15 05:04 DeepSeek-V4-Flash.md
-rw-r--r--   1 yanyu  staff     3864 May  5 14:20 Financial.md
-rw-r--r--   1 yanyu  staff  1602128 May  5 14:20 Financial.png
drwxr-xr-x@  4 yanyu  staff      128 May 16 20:08 HiDream-ai
-rw-r--r--   1 yanyu  staff     7750 May 15 05:01 Kimi-K2.6.md
-rw-r--r--@  1 yanyu  staff     4668 May  5 14:20 Legal.md
-rw-r--r--   1 yanyu  staff  1806669 May  5 14:20 Legal.png
-rw-r--r--   1 yanyu  staff   101908 May  5 14:20 LLM-README.md
-rw-r--r--@  1 yanyu  staff      846 May  5 14:20 LLM.md
-rw-r--r--   1 yanyu  staff   188476 May  5 14:20 LLM.png
-rw-r--r--@  1 yanyu  staff     8715 May  5 14:20 Medical.md
-rw-r--r--@  1 yanyu  staff  4020897 May  5 14:20 Medical.png
drwxr-xr-x@ 14 yanyu  staff      448 May 15 03:51 MiniCPM-V-4.6
drwxr-xr-x  14 yanyu  staff      448 May 17 21:25 Qwen
-rw-r--r--   1 yanyu  staff     5247 May 15 06:31 Qwen3.5-122B-A10B.md
-rw-r--r--   1 yanyu  staff    23008 May 15 05:02 QWEN3.5-397B-A17B.md
drwxr-xr-x@  4 yanyu  staff      128 May 16 19:47 Robbyant
drwxr-xr-x@  4 yanyu  staff      128 May 17 10:56 Tencent-Hunyuan
-rw-r--r--   1 yanyu  staff        0 May 18 05:29 YYC3-模型资产总览与部署建议.md
drwxr-xr-x  11 yanyu  staff      352 May 17 16:49 yyc3-finetune
drwxr-xr-x@ 16 yanyu  staff      512 May  1 20:42 Z-Image-Turbo
yanyu@yyc3-22 ~ % ls -l /Volumes/Max/models/Qwen
total 0
drwxr-xr-x  21 yanyu  staff   672 May 17 16:45 Qwen3-14B
drwxr-xr-x  16 yanyu  staff   512 May 17 21:22 Qwen3-14B-YYC3-merged
drwxr-xr-x  15 yanyu  staff   480 May 17 21:25 Qwen3-14B-YYC3-merged-gguf
drwxr-xr-x@ 20 yanyu  staff   640 May 15 02:02 Qwen3-8B
drwxr-xr-x   4 yanyu  staff   128 May 27 17:57 Qwen3-Coder-30B-A3B-Q4
drwxr-xr-x@ 23 yanyu  staff   736 Apr 30 14:57 Qwen3-Embedding-8B
drwxr-xr-x@ 19 yanyu  staff   608 May  1 22:23 Qwen3-Reranker-8B
drwxr-xr-x@ 34 yanyu  staff  1088 May  8 12:44 Qwen3.6-27B
drwxr-xr-x@ 84 yanyu  staff  2688 May 15 03:55 Qwen3.6-27B-FP8
drwxr-xr-x@ 44 yanyu  staff  1408 May  1 23:03 Qwen3.6-35B-A3B
drwxr-xr-x@ 60 yanyu  staff  1920 May 15 03:54 Qwen3.6-35B-A3B-FP8
yanyu@yyc3-22 ~ %

## NAS 模型路径及详情

YYC@YanYuCloud:/# ls -l /Volume1/yyc3_hd/data
total 36
drwxr-xr-x+ 1 YYC YYC   102 May 19 01:52 DeepSeek-Base
drwxr-xr-x+ 1 YYC YYC  3320 May 22 17:17 DeepSeek-V4-Flash
drwxr-xr-x+ 1 YYC YYC  4472 May 22 17:17 DeepSeek-V4-Pro
drwxr-xr-x+ 1 YYC YYC 18406 May 16 22:02 GLM-5.1
drwxr-xr-x+ 1 YYC YYC  9408 May 15 13:03 GLM-5.1-FP8
drwxr-xr-x+ 1 YYC YYC  5094 May 15 11:04 Kimi-K2.6
drwxr-xr-x+ 1 YYC YYC   808 May 16 22:12 MegaStyle-1.4M
drwxr-xr-x+ 1 YYC YYC   332 May 15 03:51 MiniCPM-V-4.6
-rwxr-xr-x+ 1 YYC YYC  4604 May 15 15:28 NVIDIA-DeepSeek-V4-Flash.md
-rwxr-xr-x+ 1 YYC YYC  6102 May 15 15:24 NVIDIA-Kimi-K2.6.md
-rwxr-xr-x+ 1 YYC YYC  3651 May 15 15:05 NVIDIA-Qwen3.5-122B-A10B.md
-rwxr-xr-x+ 1 YYC YYC 14151 May 15 16:00 NVIDIA-Qwen3.5-397B-A17B.md
drwxr-xr-x+ 1 YYC YYC   374 May 22 17:17 Qwen
drwxr-xr-x+ 1 YYC YYC 11638 May 16 10:59 Ring-2.6-1T
YYC@YanYuCloud:/# ls -l /Volume1/yyc3_hd/data/Qwen
total 0
drwxr-xr-x+ 1 YYC YYC  642 May 15 02:14 Qwen3-8B
drwxr-xr-x+ 1 YYC YYC 1412 Mar 16 16:45 Qwen3-Coder-30B-A3B
drwxr-xr-x+ 1 YYC YYC   80 May 16 00:06 Qwen3-Coder-30B-A3B-Q4
drwxr-xr-x+ 1 YYC YYC  686 Apr 30 14:57 Qwen3-Embedding-8B
drwxr-xr-x+ 1 YYC YYC  628 May  1 22:23 Qwen3-Reranker-8B
drwxr-xr-x+ 1 YYC YYC 3900 May 15 13:46 Qwen3.5-122B-A10B
drwxr-xr-x+ 1 YYC YYC 8732 May 15 22:05 Qwen3.5-397B-A17B
drwxr-xr-x+ 1 YYC YYC 1438 May  8 12:44 Qwen3.6-27B
drwxr-xr-x+ 1 YYC YYC 3204 May 15 03:55 Qwen3.6-27B-FP8
drwxr-xr-x+ 1 YYC YYC 2132 May  1 23:03 Qwen3.6-35B-A3B
drwxr-xr-x+ 1 YYC YYC 2196 May 15 04:10 Qwen3.6-35B-A3B-FP8

YYC@YanYuCloud:/# ls -l /Volume2/docker/models
total 0
drwxr-xr-x+ 1 YYC YYC 1434 May 16 07:36 ChatGLM3-6B
drwxr-xr-x+ 1 YYC YYC  518 Mar 15 00:13 CodeGeeX4-9B
drwxr-xr-x+ 1 YYC YYC   90 May 19 14:14 CodeGeex4-9B_Q8
drwxr-xr-x+ 1 YYC YYC  824 Mar 15 00:11 Cogagent-9B
drwxr-xr-x+ 1 YYC YYC  270 Mar 15 00:07 Cogvideox-5B
drwxr-xr-x+ 1 YYC YYC  816 May 19 03:34 Qwen3-14B
drwxr-xr-x+ 1 YYC YYC  650 May 19 02:56 Qwen3-14B-YYC3-merged
drwxr-xr-x+ 1 YYC YYC  632 May 19 03:09 Qwen3-14B-YYC3-merged-gguf
