<template>
  <div>
    <el-container>
      <el-aside width="250px">
        <el-tree :data="treeData"
                 node-key="id"
                 :props="defaultProps"
                 :allow-drop="allowDrop"
                 @node-drag-end="moveEnd"
                 :draggable="draggable">

        </el-tree>

      </el-aside>
      <el-main>
        <div class="contain">
          <div class="conditions_box" style="width: 150px;">
            <span>关系</span>
            <div>
              <el-checkbox-group v-model="conditions" @change="handleConditionsChange">
                <el-checkbox v-for="item in conditionsOption" :label="item" :key="item.id">{{item.name}}</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
          <div class="relation_box" style="min-height: 500px;border: 1px solid #ececec;">
            <div class="panel-body points demo flow_chart" id="points"
                 style="width: 500px;height: 400px;border: 1px solid #b1bec6">
              <!--<div  v-for="item in point" :id="item._id" :class="[item.name,pointClassName,otherClassName+item.status]">{{item.name}}</div>-->
            </div>

            <div id="myChart" style="width: 600px; height: 400px" v-show="picData.point.length>1"></div>

            <el-table
              v-if="point.length==1||point.length==0"
              :data="tableData"
              style="width: 500px">
              <el-table-column
                label="地址"
                prop="address">

              </el-table-column>
              <el-table-column
                label="公司名字"
                prop="name">
              </el-table-column>
              <el-table-column
                label="状态"
                prop="status">
              </el-table-column>
              <el-table-column
                label="类型"
                prop="type">
              </el-table-column>
            </el-table>

            <el-table
              v-show="point.length>1"
              :data="tableDatas"
              style="width: 100%">
              <el-table-column
                :key="index"
                v-for="(item,index) in columns"
                :label="item.name"
                :prop="item.id">
                <template slot="header" slot-scope="scope">
                  <el-button
                    size="mini"
                    :type="item.filter=='discrete'?'success':
                            item.filter=='date'? 'info':
                                            'primary'"
                    plain
                    @click="Edit(item)">{{item.name}}
                  </el-button>
                </template>
              </el-table-column>

            </el-table>

            <el-pagination
              style="margin-top: 20px"
              @current-change="handleCurrentChange"
              :total="400"
              layout="total, sizes, prev, pager, next, jumper"
            >
            </el-pagination>
            <!--弹窗开始-->
            <el-dialog
              title="提示"
              :visible.sync="dialogVisible"
              width="30%"
              :before-close="handleClose">

              <div>
                <div style="margin-right: 20px;margin-bottom: 20px;" class="filter_box"
                     v-for="item in Object.keys(presentItem)">
                  <div class="select_box" style="width: 80px;text-align: left" v-if="item!='id'">
                    {{
                    item=='equal'?'等于':
                    item=='contain'? '包含字符串':
                    item=='notEqual'? '不等于':
                    item=='moreThen'? '大于':
                    item=='moreThenOrEqual'? '大于等于':
                    item=='lessThen'? '小于':
                    item=='lessThenOrEqual'? '小于等于':
                    item=='top'? '前几个':
                    item=='min'? '最小的几个':
                    item=='max'? '最大的几个':
                    item=='higherThenAverage'? '高于平均值':
                    '低于平均值'
                    }}
                  </div>
                  <div class="val_selct">
                    <el-date-picker
                      v-if="item!='id'&&filter=='date'"
                      v-model="presentItem[item]"
                      type="date"
                      value-format="yyyy-MM-dd"
                      placeholder="选择日期">
                    </el-date-picker>
                    <el-input v-if="item!='id'&&filter!='date'" placeholder="请输入"
                              v-model="presentItem[item]" style="width: 200px;"
                    ></el-input>

                  </div>


                </div>


              </div>
              <span slot="footer" class="dialog-footer">
                <el-button @click="dialogVisible = false">取 消</el-button>
                <el-button type="primary" @click="confirm">确 定</el-button>
              </span>
            </el-dialog>


            <!--弹窗结束-->




          </div>
          <div class="slide_box">
            <div class="filter_silde" style="width: 250px;height: 100px;">
              <div v-for="item in filterArr">
                <div v-for="objItem in Object.keys(item)"
                     @click="Edit(item)"
                     v-if="objItem!='filter'&&objItem!='id'&&objItem!='valueType'&&objItem!='name'&&objItem!='discrete'&&objItem!='continue'">
                  <span v-if="objItem!='attributeId'">
                     {{objItem }} : {{item[objItem]}}
                  </span>
                  <span v-else style="color: red">
                     attributeId: {{item[objItem]}}
                  </span>

                </div>


              </div>
            </div>
            <div class="bottom_silde"></div>

          </div>

        </div>

      </el-main>

    </el-container>
  </div>

</template>

<script>
  import $ from 'jquery';
  import {jsPlumb} from 'jsplumb';

  export default {
    name: "finaldrag",
    data() {
      return {
        pageObj: {
          page: 1,
          size: 20
        },
        treeData: [],
        defaultProps: {
          children: 'children',
          label: 'name'
        },
        draggable: true,//是否可进行拖拽
        conditions: [],//选中条件数组
        conditionsOption: [],//条件全部选向
        picData: {
          point: [],
          location: [],
          line: [],
        },//绘制关系图的信息
        flag: false,
        lineArr: [],//关系图连线的信息
        line:[],//关系图连线的信息
        point:[],//关系图point信息
        tableData:[],//只有一个关系图是表格的信息,
        tableDatas:[],//只有2个关系图以上表格的信息,
        attributeIds:[],//第一个勾选的attributeIds
        columns:[],//两个关系图的 表头的信息
        filterArr:[],//两个关系图以上 表头的信息
        presentItem: {},
        dialogVisible: false,
      }
    },
    methods: {
      allowDrop(draggingNode, dropNode, type){
        if(draggingNode.level === dropNode.level){
          if(draggingNode.parent.id === dropNode.parent.id){
            return type === 'prev'
          }
        }else{
          // 不同级进行处理
        }
      },
      handleClose(){

      },
      Edit(item) {
        this.filter = item.filter
        this.dialogVisible = true;
        if (item.filter == 'date') {
          this.presentItem = {
            moreThen: item.moreThen,
            moreThenOrEqual: item.moreThenOrEqual,
            lessThen: item.lessThen,
            lessThenOrEqual: item.lessThenOrEqual,
            top: item.top,
            min: item.min,
            max: item.max,
            higherThenAverage: item.max,
            lowerThenAverage: item.lowerThenAverage,
            equal: item.equal,
            notEqual: item.notEqual,
            contain: item.contain,
            id: item.id
          }
          // console.log(this.presentItem, ' this.presentItem')

        } else if (item.filter == 'discrete') {
          this.presentItem = {
            equal: item.equal,
            notEqual: item.notEqual,
            contain: item.contain,
            id: item.id
          }
          // console.log(this.presentItem, ' this.presentItem')


        } else {
          this.presentItem = {
            moreThen: item.moreThen,
            moreThenOrEqual: item.moreThenOrEqual,
            lessThen: item.lessThen,
            lessThenOrEqual: item.lessThenOrEqual,
            top: item.top,
            min: item.min,
            max: item.max,
            higherThenAverage: item.higherThenAverage,
            lowerThenAverage: item.lowerThenAverage,
            id: item.id
          }
          // console.log(this.presentItem, ' this.presentItem')

        }
      },
      handleCurrentChange(val) {
        this.tableDatas = []
        this.pageObj.page = val
        this.getEventData()
        console.log(`当前页: ${val}`);
      },
      //确定过滤方式
      confirm() {
        this.dialogVisible = false;
        this.getEventData()
      },
      //制图
      drawLine(chartData, xAxisData) {
        // 基于准备好的dom，初始化echarts实例
        let myChart = this.$echarts.init(document.getElementById('myChart'))
        let options = {
          tooltip: {
            trigger: 'axis'
          },
          xAxis: {
            data: xAxisData
          },
          yAxis: {
            splitLine: {
              show: false
            }
          },
          toolbox: {
            left: 'center',
            feature: {
              dataZoom: {
                yAxisIndex: 'none'
              },
              saveAsImage: {}
            }
          },
          dataZoom: [{
            startValue: '2019-03-01'
          }, {
            type: 'inside'
          }],
          series: {
            type: 'line',
            data: chartData
          }
        }
        // 绘制图表
        myChart.setOption(
          options
        );
      },
      //获取两个相关连的数据
      getEventData(){
        let filterArr = this.filterArr
        let otherObj = Object.assign({}, this.presentItem)
        filterArr.forEach((item) => {
          if (item.id == otherObj.id) {
            otherObj.attributeId = item.id;
            otherObj.valueType = item.valueType;
            item.attributeId = item.id
            let otherObjArr = Object.keys(otherObj)
            otherObjArr.forEach((otherItem) => {
              item[otherItem] = otherObj[otherItem]
            })
          }
          // delete item.attributeId
          // delete item.valueType
          delete item.name
        })
        let params = {
          "eventId": "EVT-01",
          "attributeIds": this.attributeIds,
          "filters": filterArr,
          "pageNum": this.pageObj.page,
          "pageSize": this.pageObj.size
        }
        //获取两个关联数据
        this.$http.post("/events", params).then((res) => {
          // console.log(res.rows, 'rows')
          let rows = res.rows || []
          this.tableDatas = rows
          let chartData = [];
          let xAxisData = [];
          rows.forEach((item) => {
            xAxisData.push(item.date)
            chartData.push(item.value)
          })
          //绘图
          if (res.rows.length > 0) {
            this.drawLine(chartData, xAxisData)
          }
          //获取表格信息
          // 获取前面十条数据

        })

      },
      //勾选条件时候的方法
      handleConditionsChange(value) {
        let that = this;
        console.log(value)
        if (this.conditions.length > 1) {
          this.$message.error('只能勾选一个');
          return false
        }
        let attributeIds = []
        if (value[0]) {//取第一勾选的attributeIds
          value[0].attributes.forEach((item) => {
            attributeIds.push(item.id)
          })
        }
        that.attributeIds = attributeIds

        if (this.picData.point.length > 1&&this.conditions.length ==1) {
          that.getEventData()
        }
        $("#points").empty();
        that.createFlow(this.picData, value)


      },
      //拖拽结束时
      moveEnd(Node) {
        let locationArr = [
          Node.label, 4, 20
        ]//位置数组
        this.conditions = []//选中条件的清空
        this.flag = false// 是否有重复的拖拽的标志
        this.picData.point.forEach((item) => {// 是否有重复的拖拽的标志
          if (item._id == Node.data.id) {
            this.flag = true
            return
          }
        })
        if (this.flag) {
          this.$notify({
            title: '提示',
            message: '不能添加重复的元素',
          });
          return false

        } else {
          // line: [
          //   ['58c21d713819d56d68763918', '58c21d803819d56d68763919'],
          //   ['58c21d803819d56d68763919', '58c21da83819d56d6876391a'],
          //   ['58c21d803819d56d68763919', '58c63ecf3819d5a22f2c7f24'],
          //   ['58c21da83819d56d6876391a', '58c63ecf3819d5a22f2c7f24'],
          // ],line的数据结构参考
          if (this.lineArr.length > 1) {//构造line的数据结构
            let leftVal = this.lineArr[1]
            this.lineArr = []
            this.lineArr.push(leftVal)
            this.lineArr.push(Node.data.id);
          } else {
            this.lineArr.push(Node.data.id);
          }
          let pointObj = {
            _id: '' + Node.data.id,
            name: Node.label,
            status: '1',

          }
          this.picData.line.push(this.lineArr)
          this.picData.location.push(locationArr)
          this.picData.point.push(pointObj)
          jsPlumb.ready(() => {
            $("#points").empty();
            this.createFlow(this.picData);
          });

        }
        //获取条件关系
        this.conditionsOption = []
        this.$http.get("/relations", {}).then((res) => {
          this.conditionsOption = res.data || []
        }).catch((err) => {
          this.$message.error('请求失败');
          // console.log(JSON.parse(res),'resssssss')
        })
        if (this.picData.point.length == 1) {
          this.tableData=[]
          //获取第一个表格信息
          this.$http.get("entity/detail/" + Node.data.id,{}).then((res) => {
            this.tableData = ([res]) || []
          }).catch((err) => {
            this.$message.error('请求失败');
            // console.log(JSON.parse(res),'resssssss')
          })
        }


      },
      //绘制可移动的关系图
      createFlow(flowData, selectArr) {
        let that = this;
        const color = '#acd';
        const instance = jsPlumb.getInstance({
          Connector: ['Bezier', {curviness: 50}],//要使用的默认连接器的类型：折线，流程等
          Endpoint: ['Dot', {radius: 5}],//端点（锚点）的样式声明（Dot）
          DragOptions: {cursor: 'pointer', zIndex: 5000},//用于配置拖拽元素的参数
          PaintStyle: {lineWidth: 5, stroke: '#445566'},//连线样式
          EndpointStyle: {radius: 9, fill: color, stroke: 'red'},//端点的css样式声明
          HoverPaintStyle: {stroke: '#ec9f2e', lineWidth: 4},//鼠标经过线的样式
          EndpointHoverStyle: {fill: '#ec9f2e', stroke: '#acd'},//同上
          ConnectionOverlays: [//附加到每个连接的默认重叠
            ['Arrow', {
              location: 1,
              id: 'arrow',
              length: 4,
              foldback: 0.8,
              paintStyle: {
                lineWidth: 5,
                stroke: 'lightgray',
                fill: 'lightgray',
              },
            },
              ["Label", {label: "关联", cssClass: "csslabel"}]//这个是鼠标拉出来的线的属性
            ],
          ],
          Container: 'points',//设置父级的元素，一个容器
        });
        instance.batch(() => {
          const arrowCommon = {foldback: 0.7, width: 12};
          const overlays = [
            ['Arrow', {location: 0.7}, arrowCommon],
            ['Label', {label: 'custom label',},
            ],
          ];
          // init point
          // 关系图 线的信息
          that.line = flowData.line
          // 关系图 id name 的信息
          that.point = flowData.point
          that.point.forEach((item) => {
            $('.points').append(
              `<div  id="${item._id}" class="point chart_act_${item.status} ${item.name}" >${item.name}</div>`,
            );
            $("#points").on("dblclick ", ".point", function (event, inde) {
              that.$confirm('确定删除改元素, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
              }).then(() => {
                that.point.splice($(this).index(), 1)
                if (that.point.length == 0) {
                  that.point = []
                  that.tableData=[]
                }else if (that.point.length == 1) {
                  that.tableData=[]
                  //获取第一个表格信息
                  that.$http.get("entity/detail/" + that.point[0]._id, {}).then((res) => {
                    that.tableData = ([res]) || []
                  }).catch((err) => {
                    that.$message.error('请求失败');
                  })
                }
                // console.log(that.point, 'point')
                $(this).remove();
                that.$message({
                  type: 'success',
                  message: '删除成功!'
                });
              }).catch(() => {
                // that.$message({
                //   type: 'info',
                //   message: '已取消删除'
                // });
              });


            });
            let allAttributesArr = []
            if (selectArr) {//勾选的时候
              selectArr.forEach((item) => {
                let locVal = that.location += 50
                instance.connect({
                  source: item.startPoint,
                  target: item.endPoint,
                  endpoint: 'Dot',
                  overlays: [
                    ['Arrow', {width: 12, length: 12, location: 50,}],
                    ['Label', {label: item.name}, {location: locVal}, {id: 'it'}]
                  ]
                })
                instance.bind('click', function (conn, originalEvent) {
                  if (window.prompt('确定删除所点击的链接吗？ 输入1确定') === '1') {
                    // console.log(instance, 'instance')
                    instance.deleteConnection(conn)
                  }
                })
                // console.log(item.attributes, 'attributesattributesattributes')
                allAttributesArr = allAttributesArr.concat(item.attributes)
              })
            }
            that.columns = allAttributesArr;
            that.filterArr = allAttributesArr
          })
          for (let i of flowData.location) {//设置位置
            $(`.${i[0]}`).css('left', Math.random() * 400);
          }

          for (const point of flowData.point) {//可以移动
            instance.draggable(`${point._id}`);
          }

        });

        jsPlumb.fire('jsPlumbDemoLoaded', instance);
      },
      //请求获取树型数据
      getTreeData() {
        this.$http.get("/entities", {}).then((res) => {
          this.treeData = res.data || []
        }).catch((err) => {
          this.$message.error('请求失败');
        })
      },
    },
    mounted() {
      this.getTreeData()

    }


  }
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
  .filter_box {
    display: flex;
  }

  .select_box {
    margin-right: 20px;
  }

  .contain {
    display: flex;

    .relation_box {

    }

    .slide_box {
      flex: auto;
    }

    .conditions_box {
      width: 300px;
      border: 1px solid #eeeeee;
    }
  }

  .list-complete-item {
    cursor: pointer;
    position: relative;
    font-size: 14px;
    padding: 5px 12px;
    display: inline-block;
    margin-right: 20px;
    width: 50px;
    height: 50px;
    border: 1px solid #bfcbd9;
    transition: all 1s;
  }

  .list-complete-item.sortable-chosen {
    background: #4AB7BD;
  }

  .list-complete-item.sortable-ghost {
    background: #30B08F;
  }

  .undraggable {
    background-color: red;
  }

  .list-complete-enter,
  .list-complete-leave-active {
    opacity: 0;
  }

</style>
<style>
  @import '../assets/css/demo.css';
  @import '../assets/css/jsplumb.css';


</style>

