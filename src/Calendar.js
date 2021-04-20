import React, {EventApi, useState, useRef, useCallback, useEffect} from "react";
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

import { db } from "./firebase";

function App() {

  /*
  fetchData가 useEffect의 dependencies로 설정되어 있기 때문에
  렌더링마다 의존 값을 변경하지 않으려면
  fetchData를 useEffect 내부로 옮기거나 useCallback으로 감싸야 함
  */
  const fetchData = useCallback(() => {
    // 받아온 데이터를 저장할 배열
    let eventData = [];
  
    // firestore.js에서 가져온 firestore 객체
    db
        .collection("SCHEDULES") //  "tasks" 컬렉션 반환
        .get() // "tasks" 컬렉션의 모든 다큐먼트를 갖는 프로미스 반환
        .then((docs) => {
        // forEach 함수로 각각의 다큐먼트에 함수 실행
        docs.forEach((doc) => {
            // data(), id로 다큐먼트 필드, id 조회
            eventData.push({ id: doc.id
                           , title: doc.data().title
                           , color: doc.data().color
                           , start: doc.data().start
                           , end: doc.data().end });
        });
        
        setEvents((events) => events.concat(eventData));
    });
  }, []);
  
  // 최초 렌더링 이후에 실행하기 위해 useEffect 내부에서 함수 실행
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [events, setEvents] = useState([]);

  const handleSelect = (arg) => {
    let startTime = moment(arg.start);
    let endTime = moment(arg.end);

    Swal.fire({
      title: startTime.format('yyyy-MM-DD')+" 일정 추가",
      html: '<input type="text" id="cal-event" class="swal2-input" placeholder="일정명">'
          + '<input type="text" id="cal-start" class="swal2-input" placeholder="시작시간" value='+startTime.format('HH:mm')+'>'
          + '<input type="text" id="cal-end" class="swal2-input" placeholder="종료시간" value='+endTime.format('HH:mm')+'>'
          + '<div align="left">'
          + '<label for="color"> 색상 </label>'
          + '<select name="cars" id="cal-colors" placeholder="색상">'
          + '<option value="red">빨간색</option>'
          + '<option value="skyblue">파란색</option>'
          + '<option value="green">초록색</option>'
          + '<option value="orange">주황색</option>'
          + '</select>'
          + '</div>',
      showCancelButton: true,
      showCloseButton: true,

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
        title: "일정 추가 완료!",
        icon: "success",
      })
      let event = {
        title: param[0],
        color: param[3],
        start: startTime.format('yyyy-MM-DD ') + param[1],
        end: startTime.format('yyyy-MM-DD ') + param[2]
      };

      db
        .collection("SCHEDULES")
        .add(event)
        .then((res) => {
          console.log(res);
          event = {...event, id: res.id};
          setEvents(events.concat(event));
        });
    });
  }

  const handleEventClick = (arg) => {
    let startTime = moment(arg.event.start);
    let endTime = moment(arg.event.end);
    
    const selectedColor = {red: '빨간색'
                         , skyblue: '파란색'
                         , green: '초록색'
                         , orange: '주황색'};

    const selectedKeys = Object.keys(selectedColor);
    let selectedValue = "";
    let selectedKey = "";
    for(let key in selectedKeys){
      if(selectedKeys[key] == arg.event.backgroundColor) {
        selectedValue = selectedColor[selectedKeys[key]];
        selectedKey = selectedKeys[key];
        break;
      }
    }
    
    Swal.fire({
      title: startTime.format('yyyy-MM-DD')+" 일정 수정",
      html: '<div class="form-inline">'
          + '<div class="form-group" align="left" style="padding:3px;">'
          + '<label for="cal-event"> &nbsp;&nbsp;&nbsp;일정명 </label>'
          + '<input type="text" id="cal-event" class="swal2-input form-control" placeholder="일정명" value="'+arg.event.title+'">'
          + '</div>'
          + '<div class="form-inline form-group" align="left" style="padding:3px;">'
          + '<label for="cal-start"> 시작시간 </label>'
          + '<input type="text" id="cal-start" class="swal2-input form-control" placeholder="시작시간" value='+startTime.format('HH:mm')+'>'
          + '</div>'
          + '<div class="form-group" align="left" style="padding:3px;">'
          + '<label for="cal-end"> 종료시간 </label>'
          + '<input type="text" id="cal-end" class="swal2-input form-control" placeholder="종료시간" value='+endTime.format('HH:mm')+'>'
          + '</div>'
          + '<div class="form-group" align="left">'
          + '<label for="cal-colors"> 색상 </label>'
          + '<select name="colors" id="cal-colors" placeholder="색상">'
          + '<option hidden value='+selectedKey+' selected>'+selectedValue+'</option>'
          + '<option value="red">빨간색</option>'
          + '<option value="skyblue">파란색</option>'
          + '<option value="green">초록색</option>'
          + '<option value="orange">주황색</option>'
          + '</select>'
          + '</div>'
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
        });

        db
          .collection("SCHEDULES")
          .doc(arg.event.id)
          .update({
              title: param[0]
            , color: param[3]
            , start: startTime.format('yyyy-MM-DD ') + param[1]
            , end: startTime.format('yyyy-MM-DD ') + param[2]
          });
        
        setEvents(
          events.map(event => 
            event.id === arg.event.id ? {...event
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
            db
              .collection("SCHEDULES")
              .doc(arg.event.id)
              .delete()
              .then(() =>
                setEvents(
                  events.filter((event) => event.id !== arg.event.id)
                )
              );

            Swal.fire( 
                '일정이 삭제되었습니다.'
              , ''
              , 'info' 
            )
            setEvents(events.filter(event => event.id !== arg.event.id)); 
          }
        })
    }
  })
};
  const handleDateClick = (arg) => {
    let clickedTime = moment(arg.date);
    
    Swal.fire({
      title: clickedTime.format('yyyy-MM-DD')+" 일정 추가",
      html: '<input type="text" id="cal-event" class="swal2-input" placeholder="일정명">'
          + '<input type="text" id="cal-start" class="swal2-input" placeholder="시작시간" value='+clickedTime.format('HH:mm')+'>'
          + '<input type="text" id="cal-end" class="swal2-input" placeholder="종료시간">'
          + '<div align="left">'
          + '<label for="color"> 색상 </label>'
          + '<select name="colors" id="cal-colors" placeholder="색상">'
          + '<option value="red">빨간색</option>'
          + '<option value="skyblue">파란색</option>'
          + '<option value="green">초록색</option>'
          + '<option value="orange">주황색</option>'
          + '</select>'
          + '</div>',
      showCancelButton: true,
      showCloseButton: true,

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
        title: "일정 추가 완료!",
        icon: "success",
      });
      
      let event = {
        title: param[0],
        color: param[3],
        start: clickedTime.format('yyyy-MM-DD ') + param[1],
        end: clickedTime.format('yyyy-MM-DD ') + param[2]
      };

      db
        .collection("SCHEDULES")
        .add(event)
        .then((res) => {
          console.log(res);
          event = {...event, id: res.id};
          setEvents(events.concat(event));
        });
    });
  };

    return (
    <div>
      <p>
        <label for="roomSelect"> 회의실 선택 </label>
        <select name="roomId" id="cal-roomId" placeholder="회의실 선택">
          <option value="a01">지원센터6층 소회의실</option>
        </select>
      </p>
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
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "logoutButton",
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
    </div>
    );
  }

  export default App;