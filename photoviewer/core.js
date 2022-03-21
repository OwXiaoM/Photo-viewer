/**
 * 全屏图片查看器
 * 本插件基于JQuery1.8.3版本编写
 * @type {{getInstance}} 图片单例对象
 */

var PhotoViewer = (function () {
    //缓存图片查看器对象，方便实现单例

    var instantiated;

    //定义图片查看器
    function init() {
        //页面标签检测
        var $viewer = $(".photo_viewer");
        if ($viewer.length > 0) {
            throw "标签冲突，页面存在应用\"photo_viewer\"类样式的标签！";
        }

        //向页面添加查看器的相关标签元素
        var html = "<div class='photo_viewer'>";
        html += "<div class='photo_mask'></div>";
        html += "<div class='photo_change photo_left photo_prev'><div class='photo_change_btn'></div></div>";
        html += "<div class='photo_change photo_right photo_next'><div class='photo_change_btn'></div></div>";
        html += "<div class='photo_util'>";
        html += "<ul><li><i class='photo_line'></i></li>";
        html += "<li style='margin-left: 5px;'>第</li>";
        html += "<li class='photo_index'></li><li>张/总</li>";
        html += "<li class='photo_count'></li><li>张</li>";
        html += "<li style='margin-left: 5px;'><i class='photo_line'></i></li>";
        html += "<li class='photo_btn photo_prev'>上一张</li>";
        html += "<li><i class='photo_line'></i></li>";
        html += "<li class='photo_btn photo_next'>下一张</li>";
        html += "<li><i class='photo_line'></i></li>";
        html += "<li class='photo_btn photo_zoom_in' title='放大'></li>";//<img src='imgs/zoom_in.png'>
        html += "<li class='photo_percent'></li><li>%</li>";
        html += "<li class='photo_btn photo_zoom_out' title='缩小'></li>";//<img src='imgs/zoom_out.png'>
        html += "<li><i class='photo_line'></i></li>";
        html += "<li class='photo_btn resize_btn'>原始尺寸</li>";
        html += "<li><i class='photo_line'></i></li>";
        html += "<li class='photo_btn photo_rotating' title='旋转'></li>";//<img src='imgs/rotating.png'>
        html += "<li><i class='photo_line'></i></li>";
        html += "<li class='photo_btn photo_close'>关闭</li>";
        html += "<li><i class='photo_line'></i></li>";
        html += "<li id='photo_name' class='photo_name'></li></ul>";
        html += "<li><input type='text' id='input_path' placeholder='设置页数'></li>";
        html += "<li><input type='button' id='submit_page1' value='翻页'></li>";
        //html += "<li><i class ='photo_btn shown_token'></li>";
        html += "\n" +
            "<select id = 'inner_img_select' class='img_selector' onchange='get_inner_click()'>" +
            "    <option value=\"\">--Please choose an option--</option>\n" +
            "</select>";
        html += "<input type='button' id='mark' value='标记'>";
        html += "<input type='button' id='unmark' value='取消'>";
        html += "<input type='button' id='export' value='导出'>";
        html += "</div><div class='photo_container'>";
        //html += "<div id='shown_token'></div>";
        html += "<img class='photo_view'/><img class='photo_loading'></div></div>";
        $viewer = $(html);
        html = null;
        $viewer.appendTo("body");

        var pv = this;
        //规定图片相对链接的基准URL

        pv.BASE_HREF1 = "http://10.9.3.201.5001/download";
        pv.ssh_search_path = '';//寻找图片的地址，由页面传递

        //常用标签元素对象
        var $view = $viewer.find(".photo_view"), $percent = $viewer.find(".photo_percent");
        var $index = $viewer.find(".photo_index");
        var $count = $viewer.find(".photo_count");
        var $photo_name = $viewer.find(".photo_name");
        /**重置图片显示信息*/
        pv.reset = function () {
            $percent.text(pv.percent = 100);
            $view.removeAttr("style");
            $photo_name.text(pv.imgs[pv.index]);
            oX = (pv.width - $view.outerWidth(true)) / 2;
            oY = (pv.height - $view.outerHeight(true) - 51) / 2;
        };
        /**显示图片*/
        pv.view = function () {
            $index.text(pv.index + 1);
            $photo_name.text(pv.imgs[pv.index]);
            document.getElementById("input_path").value = pv.index + 1;
            //pv.reset();
            pv.rotateDeg = 0;
            $view.attr("src", pv.BASE_HREF1 + '?s_path=' + pv.ssh_search_path + '/' + '&img='
                + encodeURIComponent(pv.imgs[pv.index])).load(function () {
                pv.setPosition();
                if (typeof (oX) == 'undefined') {
                    oX = (pv.width - $view.outerWidth(true)) / 2;
                }
                if (typeof (oY) == 'undefined') {
                    oY = (pv.height - $view.outerHeight(true) - 51) / 2;
                }
                $view.css({"left": oX + "px", "top": oY + "px"});

            });


        };
        /**保存图片显示器的高宽*/
        pv.resize = function () {
            //如果有显示图片，则调整图片的位置
            if ($viewer.is(":visible")) {
                pv.width = $viewer.outerWidth(true);
                pv.height = $viewer.outerHeight(true);
                pv.setPosition();
            }
        };
        /**设置图片位置*/
        pv.setPosition = function () {
            left = (pv.width - $view.outerWidth(true)) / 2;
            right = (pv.height - $view.outerHeight(true) - 51) / 2;
            $view.css({"left": left + "px", "top": right + "px"});
        };
        /**
         * 图片的伸缩处理
         * @param zoomIn 是否放大、为false时表示缩小图片
         */
        pv.zoom = function (zoomIn) {
            //最大5倍，最小十分之一
            if (zoomIn && pv.percent >= 500 || pv.percent <= 10 && !zoomIn) {
                return;
            }
            var h = $view.innerHeight(), w = $view.innerWidth();
            //伸缩5%
            var p = parseInt(pv.percent * 0.05), ph = parseInt(h * 0.05), pw = parseInt(w * 0.05);
            p = p < 1 ? 1 : p;
            ph = ph < 1 ? 1 : ph;
            pw = pw < 1 ? 1 : pw;
            //如果是缩小，将数改为负
            if (!zoomIn) {
                p = -p, ph = -ph, pw = -pw;
            }
            //伸缩重新图片的位置
            var left = parseInt($view.css("left")), top = parseInt($view.css("top"));

            $percent.text(pv.percent = pv.percent + p);
            $view.css({
                "height": (h + ph) + "px",
                "width": (w + pw) + "px",
                "top": parseInt(top - ph / 2) + "px",
                "left": parseInt(left - pw / 2) + "px"
            });
        };
        /**
         * 旋转图片
         */
        pv.transform = function () {
            $view.css("transform", "rotate(" + pv.rotateDeg + "deg)");
            $view.css("-ms-transform", "rotate(" + pv.rotateDeg + "deg)");
            $view.css("-webkit-transform", "rotate(" + pv.rotateDeg + "deg)");
            $view.css("-moz-transform", "rotate(" + pv.rotateDeg + "deg)");
            $view.css("-o-transform", "rotate(" + pv.rotateDeg + "deg)");
        };
        //放大图片点击事件
        $viewer.find(".photo_zoom_in").click(function () {
            pv.zoom(true);
        });
        //缩小图片点击事件
        $viewer.find(".photo_zoom_out").click(function () {
            pv.zoom(false);
        });
        //关闭查看器
        $viewer.find(".photo_close").click(function () {
            $viewer.hide();
        });
        //显示原始尺寸
        $viewer.find(".resize_btn").click(function () {
            pv.reset();
            pv.setPosition();
        });
        //点击显示上一张图
        $viewer.find(".photo_prev").click(function () {
            pv.index = pv.index - 1;
            if (pv.index < 0) {
                pv.index = pv.count - 1;
            }
            $photo_name.text(pv.imgs[pv.index]);
            //document.getElementById('#photo_name').style.backgroundColor='blue';
            //console.log($photo_name.backgroundColor);
            change_name_color(pv.index);
            pv.view();
        });
        //点击显示下一张图
        $viewer.find(".photo_next").click(function () {
            pv.index++;
            if (pv.index >= pv.count) {
                pv.index = 0;
            }
            $photo_name.text(pv.imgs[pv.index]);
            change_name_color(pv.index);
            pv.view();
        });
        //点击旋转图片
        $viewer.find(".photo_rotating").click(function () {
            pv.rotateDeg += 90;
            if (pv.rotateDeg == 360) {
                pv.rotateDeg = 0;
            }
            pv.transform();
        });

        /*
         *  ****** 处理图片的拖拽 start *****
         */
        var dragging = false;
        var iX, iY;
        //鼠标按下，激活拖拽，设置鼠标捕获
        $view.mousedown(function (e) {
            dragging = true;
            iX = e.clientX - this.offsetLeft;
            iY = e.clientY - this.offsetTop;
            this.setCapture && this.setCapture();
            return false;
        });
        var eventHandle = {
            getEvent: function (event) {
                return event || window.event;
            },
            addEvent: function (element, type, handler) {
                if (element.addEventListener) {
                    element.addEventListener(type, handler, false);
                } else if (element.attachEvent) {
                    element.attachEvent('on' + type, handler);
                } else {
                    element['on' + type] = handler;
                }
            },
            getWheelDelta: function (event) {
                return event.wheelDelta ? event.wheelDelta : (-event.detail) * 40;
            }
        }

        function mouseHandle(event) {
            event = eventHandle.getEvent(event);
            var delta = eventHandle.getWheelDelta(event);

            if (delta == 180 || delta == 120) {
                pv.zoom(true);
            }
            if (delta == -180 || delta == -120) {
                pv.zoom(false);
            }
        }

        eventHandle.addEvent(document, 'mousewheel', mouseHandle);
        eventHandle.addEvent(document, 'DOMMouseScroll', mouseHandle);
        //拖拽开始
        document.onmousemove = function (e) {
            if (dragging) {
                e = e || window.event;
                oX = e.clientX - iX;
                oY = e.clientY - iY;
                $view.css({"left": oX + "px", "top": oY + "px"});
                return false;
            }
        };
        //释放鼠标捕获，阻止冒泡
        $(document).mouseup(function (e) {
            dragging = false;
            e.cancelBubble = true;
        });
        /* ****** 处理图片的拖拽 end ******/

        $viewer.find("#submit_page1").click(function () {
            var search_path = document.getElementById("input_path").value;
            if (search_path >= 1 && search_path <= pv.count) {
                pv.index = search_path - 1;
                $photo_name.text(pv.imgs[pv.index]);
                pv.view();
            } else {
                alert("请输入正确的范围")
            }
        });
        $viewer.find("#mark").click(function () {
            //var options = $('#inner_img_select option:selected');
            //var index = parseInt(options.val());
            $('#inner_img_select option')[pv.index].style.backgroundColor = 'palevioletred';
            $('#inner_img_select option')[pv.index].style.color = 'white';
            //$viewer.find(".photo_name").style.backgroundColor='blue';
            change_name_color(pv.index);
        });
        $viewer.find("#unmark").click(function () {
            $('#inner_img_select option')[pv.index].style.backgroundColor = 'white';
            $('#inner_img_select option')[pv.index].style.color = 'black';
            change_name_color(pv.index);
        });

        function download(filename, text) {//原地下载被选中的文件，不需要接触后端
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', filename);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }

        function change_name_color(index){
            if ($('#inner_img_select option')[index].style.backgroundColor == 'palevioletred'){
            document.getElementById('photo_name').style.cssText='background-color:red';}
            else{
                document.getElementById('photo_name').style.cssText='background-color:lightseagreen';}
            }


        $viewer.find("#export").click(function () {
            var head = decodeURIComponent(pv.ssh_search_path);
            var selected_imgs = '';
            //selected_imgs.push(decodeURIComponent(pv.ssh_search_path));
            for (var i = 0; i < pv.count; i++) {
                if ($('#inner_img_select option')[i].style.backgroundColor == 'palevioletred') {
                    //selected_imgs.push(pv.imgs[i]);
                    selected_imgs = selected_imgs + pv.imgs[i] + '\n';
                }
            }
            download(head + '.txt', head + '\n' + selected_imgs);
        });


        //浏览器在调整大小的时候，保存图片显示器的高宽
        $(window).resize(pv.resize);

        $(document).keypress(function (e) {

            if (e.keyCode == 13) {
                pv.index = pv.index + 1;
                if (pv.index >= pv.count) {
                    pv.index = 0;
                    $photo_name.text(pv.imgs[pv.index]);
                }
                change_name_color(pv.index);
                pv.view();
            }
            if (e.keyCode == 32) {
                pv.index = pv.index - 1;
                if (pv.index < 0) {
                    pv.index = pv.count - 1;
                }
                $photo_name.text(pv.imgs[pv.index]);
                change_name_color(pv.index);
                pv.view();
            }
        });
        //图片查看器的公共方法


        return {
            /**
             * 显示查看器
             * @param imgs 图片路径数组
             * @param index 默认要显示的图片下标,不传时默认为0
             */
            show: function (imgs, index) {
                if (!$.isArray(imgs)) {
                    throw "请输入图片路径数组！";
                } else if (imgs.length < 1) {
                    alert("输入路径下不含有图片");
                    throw "图片路径数组长度为0！";
                }
                pv.imgs = imgs;
                pv.index = $.isNumeric(index) ? index : 0;
                $count.text(pv.count = imgs.length);
                pv.reset();
                $viewer.show();
                pv.resize();
                pv.view();
                //console.log(pv.imgs);
                var images_select_list = pv.imgs;
                document.getElementById('inner_img_select').options.length = 0;
                selections = document.getElementById('inner_img_select');
                for (let i = 0; i < images_select_list.length; ++i) {
                    var opt = new Option(images_select_list[i], i);//创建图片列表
                    selections.options.add(opt);

                }

            },
            get_inner_index: function (index) {//通过内部列表翻页
                pv.index = index;
                pv.view();
            },

            /**
             * 设置图片相对链接的基准URL
             * @param BASE_HREF 图片相对链接的基准URL,不传时默认为空字符
             */
            setBaseHref: function (BASE_HREF) {
                pv.BASE_HREF = BASE_HREF;
            },
            setSshPath: function (ssh_search) {
                pv.ssh_search_path = ssh_search;
            }

        };
    }

    //暴露获取图片查看器单例对象的方法
    return {
        /**
         * 获取图片查看器的单例对象
         * @param BASE_HREF 图片相对链接的基准URL,不传时默认为空字符
         * @returns 图片查看器对象
         */
        getInstance: function (ssh_path) {
            if (!instantiated) {
                instantiated = init();
            }
            if (ssh_path) {
                instantiated.setSshPath(ssh_path);
            }
            return instantiated;
        }
    };

})();