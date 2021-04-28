import React, {EventApi, useState, useRef, useCallback, useEffect} from "react";
import "./Calendar.css";
import FullCalendar, { CalendarApi, formatDate } from "@fullcalendar/react";
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
import Button from '@material-ui/core/Button';
import flatpickr from "flatpickr";
import 'flatpickr/dist/flatpickr.min.css';

import { db } from "./firebase";
import {auth} from "./firebase";
import { actionTypes } from './reducer';
import { useStateValue } from './StateProvider';
function Calendar() {

  const [events, setEvents] = useState([]);
  const [initialState, setInitialState] = useState(false);
  const [state, setState] = useState('');
  const [weekStartDate, setWeekStartDate] = useState(new Date()); // start date of Weeks
  const [weekEndDate, setWeekEndDate] = useState(''); // end date of Weeks
  const [confRoomCd, setConfRoomCd] = useState('a01'); // 회의실 코드 set

  const dupWarnMsg = {
    icon: 'error',
    title: '일정 중복',
    text: '해당시간대에 이미 일정이 존재합니다.',
  };

  const flatpickerOption = {
    enableTime: true,
    noCalendar: true,
    dateFormat: "H:i",
    minTime: "08:00",
    maxTime: "17:00",
    minuteIncrement: 30,
  };

    
  const selectedColor = {
    red: '빨간색',
    orange: '주황색',
    green: '초록색',
    pink: '분홍색',
    skyblue: '파란색',
    navy: '남색',
    purple: '보라색'};

  const htmlSelectColor = 
    '<div align="left">'
  + '<label for="color"> 색상 </label>'
  + '<select name="cars" id="cal-colors" placeholder="색상">'
  + '<option value="red">빨간색</option>'
  + '<option value="orange">주황색</option>'
  + '<option value="green">초록색</option>'
  + '<option value="pink">분홍색</option>'
  + '<option value="skyblue">파란색</option>'
  + '<option value="navy">남색</option>'
  + '<option value="purple">보라색</option>'
  + '</select>'
  + '</div>';

  const [{user}, dispatch] = useStateValue();
  const handleSubmit = (e) => {
    e.preventDefault();
    auth
      .signOut().then(() => {
        dispatch({
          type: actionTypes.SET_USER,
          user: null,
        })
      }).catch((error) => {
        // An error happened.
      });
  }

  const checkFromToTime = (startTime, endTime) => {
    console.log("startTime="+startTime);
    console.log("endTime="+endTime);
    for(let event of events){
      if( (endTime > event.start && endTime <= event.end)
        || (startTime <= event.start && endTime >= event.end)
        || (startTime >= event.start && startTime < event.end)) {
        return true;
      }
    }
    return false;
  }

  /*
  fetchData가 useEffect의 dependencies로 설정되어 있기 때문에
  렌더링마다 의존 값을 변경하지 않으려면
  fetchData를 useEffect 내부로 옮기거나 useCallback으로 감싸야 함
  */
  const fetchData = useCallback(() => {
    setInitialState(true);
    // 받아온 데이터를 저장할 배열
    let eventData = [];
    setEvents([]);
    // firestore.js에서 가져온 firestore 객체
    db
        .collection("SCHEDULES") //  "tasks" 컬렉션 반환
        .where("confRoomCd", "==", confRoomCd)
        .where("start", ">", moment(weekStartDate).day(1).format('yyyy-MM-DD 00:00'))
        .where("start", "<", moment(weekEndDate).day(6).format('yyyy-MM-DD 00:00'))
        .get() // "tasks" 컬렉션의 모든 다큐먼트를 갖는 프로미스 반환
        .then((docs) => {
        // forEach 함수로 각각의 다큐먼트에 함수 실행
        docs.forEach((doc) => {
            // data(), id로 다큐먼트 필드, id 조회
            eventData.push({ id: doc.id
                           , confRoomCd : doc.data().confRoomCd
                           , title: doc.data().title
                           , color: doc.data().color
                           , start: doc.data().start
                           , end: doc.data().end });
        });
        
        setEvents((events) => events.concat(eventData));
    });
  }, [state]);

  // 최초 렌더링 이후에 실행하기 위해 useEffect 내부에서 함수 실행
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const onChange = e => {
    const { name, value } = e.target;
    let eventData = [];
    setEvents([]);
    setConfRoomCd(value);
    
    db
        .collection("SCHEDULES") //  "tasks" 컬렉션 반환
        .where(name, "==", value)
        .where("start", ">", moment(weekStartDate).day(1).format('yyyy-MM-DD 00:00'))
        .where("start", "<", moment(weekEndDate).day(6).format('yyyy-MM-DD 00:00'))
        .get() // "tasks" 컬렉션의 모든 다큐먼트를 갖는 프로미스 반환
        .then((docs) => {
        // forEach 함수로 각각의 다큐먼트에 함수 실행
        docs.forEach((doc) => {
          // data(), id로 다큐먼트 필드, id 조회
            eventData.push({ id: doc.id
                           , confRoomCd : doc.data().confRoomCd
                           , title: doc.data().title
                           , color: doc.data().color
                           , start: doc.data().start
                           , end: doc.data().end });
        });

        setEvents(eventData);
      });
  }

  const handleSelect = (arg) => {
    console.log("name="+user.email);
    let startTime = moment(arg.start);
    let endTime = moment(arg.end);
    if(checkFromToTime(startTime.format('yyyy-MM-DD HH:mm')
                     , endTime.format('yyyy-MM-DD HH:mm')) ){
      Swal.fire(dupWarnMsg);
      return;
    }
    let flatpickrInstancesStart;
    let flatpickrInstanceEnd;

    Swal.fire({
      title: startTime.format('yyyy-MM-DD')+" 일정 추가",
      html: '<input type="text" id="cal-event" class="swal2-input" placeholder="일정명">'
          //+ '<input type="text" id="cal-start" class="swal2-input" placeholder="시작시간" value='+startTime.format('HH:mm')+'>'
          //+ '<input type="text" id="cal-end" class="swal2-input" placeholder="종료시간" value='+endTime.format('HH:mm')+'>'
          + '<input class="swal2-input" id="cal-start" placeholder="시작시간" value='+startTime.format('HH:mm')+'>'
          + '<input class="swal2-input" id="cal-end" placeholder="종료시간" value='+endTime.format('HH:mm')+'>'
          + htmlSelectColor,
      stopKeydownPropagation: false,
      showCancelButton: true,
      showCloseButton: true,

      willOpen: () => {
        flatpickrInstancesStart = flatpickr(
          Swal.getPopup().querySelector('#cal-start'),
          flatpickerOption
        );
        flatpickrInstanceEnd = flatpickr(
          Swal.getPopup().querySelector('#cal-end'),
          flatpickerOption
        )
      },
      preConfirm: function () {
        console.log(flatpickr.formatDate(flatpickrInstancesStart.selectedDates[0], 'H:i'));
        const start = Swal.getPopup().querySelector('#cal-start').value;
        const end = Swal.getPopup().querySelector('#cal-end').value;
        //const password = Swal.getPopup().querySelector('#password').value
        if (checkFromToTime(startTime.format('yyyy-MM-DD ') + start 
                          , startTime.format('yyyy-MM-DD ') + end) ){
         Swal.showValidationMessage(`해당 시간대에 이미 일정이 존재합니다.`);
        }
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
        confRoomCd: confRoomCd,
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
          + '<option value="orange">주황색</option>'
          + '<option value="green">초록색</option>'
          + '<option value="pink">분홍색</option>'
          + '<option value="skyblue">파란색</option>'
          + '<option value="navy">남색</option>'
          + '<option value="purple">보라색</option>'
          + '</select>'
          + '</div>'
          + '</div>',
      showCloseButton: true,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "수정",
      denyButtonText: "삭제",
      preConfirm: function () {
        if(checkFromToTime(startTime.format('yyyy-MM-DD ') + $('#cal-end').val())){
          Swal.fire(dupWarnMsg);
          return;          
        }

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

    let flatpickrInstancesStart;
    let flatpickrInstanceEnd;
    
    Swal.fire({
      title: clickedTime.format('yyyy-MM-DD')+" 일정 추가",
      html: '<input type="text" id="cal-event" class="swal2-input" placeholder="일정명">'
          //+ '<input type="text" id="cal-start" class="swal2-input" placeholder="시작시간" value='+clickedTime.format('HH:mm')+'>'
          //+ '<input type="text" id="cal-end" class="swal2-input" placeholder="종료시간">'
          + '<input class="swal2-input" id="cal-start" placeholder="시작시간" value='+clickedTime.format('HH:mm')+'>'
          + '<input class="swal2-input" id="cal-end" placeholder="종료시간">'
          + htmlSelectColor,
      showCancelButton: true,
      showCloseButton: true,

      willOpen: () => {
        flatpickrInstancesStart = flatpickr(
          Swal.getPopup().querySelector('#cal-start'),
          flatpickerOption
        );
        flatpickrInstanceEnd = flatpickr(
          Swal.getPopup().querySelector('#cal-end'),
          flatpickerOption
        )
      },

      preConfirm: function () {
        if(checkFromToTime(clickedTime.format('yyyy-MM-DD ') + $('#cal-end').val())){
          Swal.fire(dupWarnMsg);
          return;          
        }
          
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
          title: "일정 추가 완료!",
          icon: "success",
        });
        
        let event = {
          title: param[0],
          confRoomCd: confRoomCd,
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
      }
    });
  };

    return (
    <div>
        <div align="left">
          <label for="roomSelect" align="left"> 회의실 선택 </label>
          <select name="confRoomCd" value={confRoomCd} id="cal-roomId" onChange={onChange} placeholder="회의실 선택">
            <option value="a01">지원센터 6층 소회의실</option>
            <option value="a02">지원센터 6층 대회의실</option>
          </select>
        </div>
        <div align="right">
          <Button onClick={handleSubmit}>Logout</Button>
        </div>
      <div className="MainDiv">
          <FullCalendar
            locale="ko"
            // customButtons={{
            //   logoutButton:{
            //     text: "logout",
            //     click: function() {
            //       Swal.fire('Logout Complete!', '', 'info');
            //     }
            //   }
            // }}
            datesSet={
              (arg) => {
                setWeekStartDate(() => moment(arg.startStr).format('yyyy-MM-DD HH:mm'));
                setWeekEndDate(() => moment(arg.endStr).format('yyyy-MM-DD HH:mm'));
                if(initialState) {
                  setState([]);
                }
              }
            }
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: ""
              // right: "logoutButton",
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
            height="600px"
            //contentHeight="auto"
            events={events}
            expandRows={true}
          />
      </div>
    </div>
    );
  }

  export default Calendar;