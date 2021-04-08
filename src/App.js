import React, {EventApi, useState, useRef} from "react";
import "./App.css";
import FullCalendar, { formatDate } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; // needed for dayClick

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';

import 'jquery/dist/jquery.min.js';
import 'popper.js/dist/umd/popper.min.js'
import $ from 'jquery';

import moment from 'moment';
import Swal from 'sweetalert2';

function App() {
  const someMethod = () => {
    let calendarApi = this.calendarRef.current.getApi();
    calendarApi.next();
  }

  const [events, setEvents] = useState([
    {
      id: 1,
      title: "event1",
      color: "red",
      start: "2021-04-06 10:00",
      end: "2021-04-06 11:00",
    },
    {
      id: 2,
      title: "event2",
      color: "orange",
      start: "2021-04-08 12:00",
      end: "2021-04-08 13:00",
    },
    {
      id: 3,
      title: "event3",
      color: "skyble",
      start: "2021-04-09 14:00",
      end: "2021-04-09 15:00",
    }
  ]);

  // const onCreate = () => {
  //   let clickedTime = moment();
  //   const event = {
  //     title: "evnet 4",
  //     color: "red",
  //     start: clickedTime.format('yyyy-MM-DD HH:mm'),
  //     end: clickedTime.add(1,'h').format('yyyy-MM-DD HH:mm')
  //   };
  //   setEvents(events.concat(event));
  // }

  const nextId = useRef(4);

  const handleSelect = (arg) => {
    let startTime = moment(arg.start);
    let endTime = moment(arg.end);

    Swal.fire({
      title: startTime.format('yyyy-MM-DD')+" 일정 추가",
      /*input: 'select',
      inputOptions: {
        'red': '빨간색',
        'blue': '파란색',
        'yellow': '노란색',
        'orange': '주황색',
      },
      inputPlaceholder: '색상',*/
      html: '<input type="text" id="cal-event" class="swal2-input" placeholder="일정명">'
          + '<input type="text" id="cal-start" class="swal2-input" placeholder="시작시간" value='+startTime.format('HH:mm')+'>'
          + '<input type="text" id="cal-end" class="swal2-input" placeholder="종료시간" value='+endTime.format('HH:mm')+'>'
          + '<select name="cars" id="cal-colors" placeholder="색상">'
          + '<option value="red">빨간색</option>'
          + '<option value="blue">파란색</option>'
          + '<option value="green">초록색</option>'
          + '<option value="orange">주황색</option>'
          + '</select>',
      showCancelButton: true,

      preConfirm: function () {
        return new Promise(function (resolve) {
          resolve([
            $('#cal-event').val(),
            $('#cal-start').val(),
            $('#cal-end').val(),
            $('#cal-colors').val()
          ])
        })
      },

      type: 'success',
      inputValidator: function (value) {
        return new Promise(function (resolve, reject) {
          if (value !== '') {
            resolve();
          } else {
            reject('You need to select a Tier');
          }
        });
      }
    }).then(function(result) {
      let param = JSON.parse(JSON.stringify(result.value));
      Swal.fire({
        //type: 'success',
        title: "일정 추가 완료!",
        //text: "시간을 준수하십시오",
        icon: "success",
        //html: 'You selected: ' + JSON.stringify(result)
      })
      const event = {
        id: nextId.current,
        title: param[0],
        color: param[3],
        start: startTime.format('yyyy-MM-DD ') + param[1],
        end: startTime.format('yyyy-MM-DD ') + param[2]
      };
      setEvents(events.concat(event));
      nextId.current += 1;
    });
  }

  const handleEventClick = (arg) => {
    let startTime = moment(arg.event.start);
    let endTime = moment(arg.event.end);
    //alert(clickedTime);
    console.log(arg.event.id);
    Swal.fire({
      title: startTime.format('yyyy-MM-DD')+" 일정 수정",
      html: '<input type="text" id="cal-event" class="swal2-input" placeholder="일정명" value='+arg.event.title+'>'
          + '<input type="text" id="cal-start" class="swal2-input" placeholder="시작시간" value='+startTime.format('HH:mm')+'>'
          + '<input type="text" id="cal-end" class="swal2-input" placeholder="종료시간" value='+endTime.format('HH:mm')+'>'
          + '<div align="left">'
          + '<label for="color"> 색상 </label>'
          + '<select name="colors" id="cal-colors" placeholder="색상">'
          + '<option value="red">빨간색</option>'
          + '<option value="blue">파란색</option>'
          + '<option value="green">초록색</option>'
          + '<option value="orange">주황색</option>'
          + '</select>'
          + '</div>',
      showCloseButton: true,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "수정",
      denyButtonText: "삭제",
      preConfirm: function () {
        return new Promise(function (resolve) {
          resolve([
            $('#cal-event').val(),
            $('#cal-start').val(),
            $('#cal-end').val(),
            $('#cal-colors').val()
          ])
        })
      },

      type: 'success',
    }).then(function(result) {
      if(result.isConfirmed) {
        let param = JSON.parse(JSON.stringify(result.value));
        Swal.fire({
          title: "일정 수정 완료!",
          icon: "success",
        })
        
        setEvents(
          events.map(event => 
            event.id == arg.event.id ? {...event
                                      , title: param[0]
                                      , color: param[3]
                                      , start: startTime.format('yyyy-MM-DD ') + param[1]
                                      , end: startTime.format('yyyy-MM-DD ') + param[2]} : event 
          )
        );
      }
      else if(result.isDenied) {
        Swal.fire({
          title: "정말로 삭제하시겠습니까?",
          showCancelButton: true,      
          confirmButtonColor: '#DD6B55',
          confirmButtonText: 'Yes',
          cancelButtonText: "No",
        }).then((result) => { 
          if (result.isConfirmed) {
            Swal.fire( 
                '일정이 삭제되었습니다.'
              , ''
              , 'info' 
            )
            setEvents(events.filter(event => event.id != arg.event.id)); 
          }
        })
    }
  })
};
  const handleDateClick = (arg) => {
    /*$("#myModal").modal("show");
    $(".modal-body").html("");
    $(".modal-body").html("<h6>"+arg.dateStr+"</h6>");*/
    let clickedTime = moment(arg.date);
    console.log(clickedTime.format('yyyy-MM-DD HH:mm'));
    Swal.fire({
      title: clickedTime.format('yyyy-MM-DD')+" 일정 추가",
      /*input: 'select',
      inputOptions: {
        'red': '빨간색',
        'blue': '파란색',
        'yellow': '노란색',
        'orange': '주황색',
      },
      inputPlaceholder: '색상',*/
      html: '<input type="text" id="cal-event" class="swal2-input" placeholder="일정명">'
          + '<input type="text" id="cal-start" class="swal2-input" placeholder="시작시간" value='+clickedTime.format('HH:mm')+'>'
          + '<input type="text" id="cal-end" class="swal2-input" placeholder="종료시간">'
          + '<div align="left">'
          + '<label for="color"> 색상 </label>'
          + '<select name="colors" id="cal-colors" placeholder="색상">'
          + '<option value="red">빨간색</option>'
          + '<option value="blue">파란색</option>'
          + '<option value="green">초록색</option>'
          + '<option value="orange">주황색</option>'
          + '</select>'
          + '</div>',
      showCancelButton: true,

      preConfirm: function () {
        return new Promise(function (resolve) {
          resolve([
            $('#cal-event').val(),
            $('#cal-start').val(),
            $('#cal-end').val(),
            $('#cal-colors').val()
          ])
        })
      },

      type: 'success',
      inputValidator: function (value) {
        return new Promise(function (resolve, reject) {
          if (value !== '') {
            resolve();
          } else {
            reject('You need to select a Tier');
          }
        });
      }
    }).then(function(result) {
      let param = JSON.parse(JSON.stringify(result.value));
      Swal.fire({
        //type: 'success',
        title: "일정 추가 완료!",
        //text: "시간을 준수하십시오",
        icon: "success",
        //html: 'You selected: ' + JSON.stringify(result)
      })
      const event = {
        id: nextId.current,
        title: param[0],
        color: param[3],
        start: clickedTime.format('yyyy-MM-DD ') + param[1],
        end: clickedTime.format('yyyy-MM-DD ') + param[2]
      };
      setEvents(events.concat(event));
      nextId.current += 1;
    });
    // bind with an arrow function
    //alert(arg.dateStr);
    /*let clickedTime = moment(arg.date);
    const event = {
      title: "evnet 4",
      color: "red",
      start: clickedTime.format('yyyy-MM-DD HH:mm'),
      end: clickedTime.add(1,'h').format('yyyy-MM-DD HH:mm')
    };
    setEvents(events.concat(event));*/
  };

    return (
      // <FullCalendar
      //   plugins={[dayGridPlugin, interactionPlugin]}
      //   dateClick={this.handleDateClick}
      //   droppable={this.handleDraggable}
      // />
    <div className="MainDiv">
        <FullCalendar
          locale="ko"
          customButtons={{
            logoutButton:{
              text: "logout",
              click: function() {
                Swal.fire('Logout Complete!', '', 'info');
              }
            }
          }}
          //ref={this.calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "logoutButton",
            //right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          select={handleSelect}
          initialView="timeGridWeek"
          weekends={false}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="17:00:00"
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: false
          }}
          eventTimeFormat={{ // like '14:30:00'
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          selectable={true}
          height="auto"
          contentHeight="auto"
          events={events}
        />
    </div>
    );
  }

  export default App;