## 属性

<a href="#Btn"> @Btn | @btn 按钮</a>

<a href="#ProgressBar"> @ProgressBar | @progressBar 进度条</a>

<a href="#Toggle"> @Toggle | @toggle 选项按钮</a>

<a href="#png9"> @.9 九宫格</a>

<a href="#ar"> @ar 锚点</a>

<a href="#full"> @full 全屏</a>

<a href="#ignore"> @ignore | @ig 忽略导出图片和节点</a>

<a href="#ignorenode"> @ignorenode | @ignode 忽略导出节点</a>

<a href="#ignoreimg"> @ignoreimg | @igimg 忽略图片</a>

<a href="#img"> @img 图片选项</a>

<a href="#flip"> @flip 翻转图像</a>

<a href="#flipX"> @flipX 翻转图像 (flip 变种)</a>

<a href="#flipY"> @flipY 翻转图像 (flip 变种)</a>

### 移除
~~<a href="#size"> @size 尺寸</a>~~

~~<a href="#scale"> @scale 缩放</a>~~



### 组件

<a id="Btn"></a>
```
@Btn || @btn

作用图层: 所有图层
```

<a id="ProgressBar"></a>
```
@ProgressBar || @progressBar
作用图层: 组图层

@bar 

bar 为 ProgressBar 的属性，类型为 Sprite
作用图层: 图像图层
```

<a id="Toggle"></a>
```
@Toggle || @toggle
作用图层: 组图层

@check

check 为 Toggle 的属性，类型为 Sprite
作用图层: 图像图层


```

### Field


<a id="png9"></a>
```
@.9{l:0,r:0,b:0,t:0}  

九宫格
作用图层: 图像图层

参数：
    l = left
    r = right
    b = bottom
    t = top
    ps: 
        l r 只填写其中一项，则为对称
        b t 同上
        不填写则默认为 0
```

```
@ar{x:0,y:0}

锚点
作用图层: 所有图层

参数：
    参数都为可选
    不填写则默认为 0.5

```



<a id="full"></a>
```
@full

节点设置为全屏尺寸
作用图层: 组图层

```

<a id="ignore"></a>
```
@ignore
@ig

忽略导出图像和节点
作用图层: 所有图层
```

<a id="ignorenode"></a>
```
@ignorenode
@ignode

忽略导出节点
作用图层: 所有图层
```

<a id="ignoreimg"></a>
```
@ignoreimg
@igimg

忽略导出图像
作用图层: 图像图层
```

<a id="img"></a>
```
@img{name:string,id:number,bind:number}

定制图片
作用图层：图像图层

参数：
    id: number 可选 当前文档中图片唯一 id
    name: string 可选 导出的图片名
    bind: number 可选 绑定 图像 id
```

<a id="flip"></a>
```
@flip{bind: 0, x: 0, y: 0}

镜像图像
作用图层：图像图层

参数：
    bind: number 必选 被绑定的图片 需要用  @img{id:number} 做标记
    x: 0 | 1, 可选， 1 为 进行 x 方向镜像
    y: 0 | 1, 可选， 1 为 进行 y 方向镜像
    x,y 都缺省时，默认 x 方向镜像

注意：
    @flip 的图层不会导出图像
```

<a id="flipX"></a>
```
@flipX{bind: 0}

flip 的变种 x 方向镜像图像
作用图层：图像图层

参数：
    bind: number 必选 被绑定的图片 需要用  @img{id:number} 做标记
 
注意：
    @flipX 的图层不会导出图像
```

<a id="flipY"></a>
```
@flipY{bind: 0}

flip 的变种 y 方向镜像图像vv
作用图层：图像图层

参数：
    bind: number 必选 被绑定的图片 需要用  @img{id:number} 做标记
 
注意：
    @flipY 的图层不会导出图像
```

---
---
---
### 移除
<a id="size"></a>
```
@size{w:100,h:100}

节点尺寸 非图片尺寸
作用图层: 所有图层

参数：
    w?: 宽
    h?: 高
    只对填写的参数生效，未填写的则为计算到的值
    无参数不生效
    
```

<a id="scale"></a>
```
@scale{x:1,y:1}

节点缩放
作用图层: 所有图层

参数：
    x?: x 方向
    y?: y 方向
    只对填写的参数生效，未填写的则为 1 
    
```
---
---
---

### 说明
    多个字段可作用在同一个图层上，按需使用
    为做到所见所得，移除手动设置 @size 和 @scale，修改为自动计算，使用方式为 `@img{bind:目标id}` `@flipX{bind:目标id}` `@flipY{bind:目标id}`



### 例如
```
节点名@Btn@size{w:100,h:100}

节点名@ar{x:1,y:1}@full@img{name:bg}
```


## 注意事项
### 美术
- 智能图层  支持 
- 蒙版，形状这些图层需要栅格化，或转为智能图层使用  
- 图层样式
  - 颜色叠加： 文本图层支持，图像图层不支持
  - 描边： 文本图层支持
  - 其他图层样式不支持

工具会把 画布外的图像也导出成图片，需要美术将 画布外 不需要导出的图像处理掉



### 程序 配置
json 文件，key 为组件名，val 为 预制体参数
如下：
```
{
    "cc.Label": {
        "__type__": "e4f88adp3hERoJ48DZ2PSAl",
        "_N$file":{
            "__uuid__": "803c185c-9442-4b99-af1a-682f877539ab"
        },
        "_isSystemFontUsed": false,
        "isFixNumber": true
    }
}
```

##### 特殊配置
```
 "textOffsetY":{
        "default": -3,
        "36": -3
    }


textOffsetY label节点 Y 偏移

以字号为 key ，偏移值 为 val
如果没有配置 某些字号，则 使用 default 默认偏移值，如果没有配置 default， 偏移为 0

```

### 已知bug
使用 强制导出图片选项时，输入为多个 psd 或含有多个 psd 文件的文件夹时，如果在不同 psd 含有相同 md5 的图像，则会在各自目录下生成相同 uuid 的图片





### CHANGELOG
- 增加只导出 图片功能

- 移除 @mirror 中的参数: {id}
- 移除 @flipX & @flipY 中的参数: {id}
- 使用 @flip 替换 @mirror
- @img 增加 {id, bind} 参数
- 增加 @scale
- 移除 @scale @size
