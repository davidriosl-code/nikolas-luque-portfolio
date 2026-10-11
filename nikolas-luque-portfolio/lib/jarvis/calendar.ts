type CalendarEvent = {title:string;start:string;minutes:number};

// RFC 5545 folds at 75 octets without cutting UTF-8 characters.
function fold(line:string):string {
  const encoder=new TextEncoder();const lines:string[]=[];let current="",size=0;
  for(const char of line){const bytes=encoder.encode(char).length;if(size+bytes>75){lines.push(current);current=" ";size=1;}current+=char;size+=bytes;}
  lines.push(current);return lines.join("\r\n");
}

export function createCalendarFile(event:CalendarEvent,uid:string,now=new Date()):string {
  const start=new Date(event.start),end=new Date(start.valueOf()+event.minutes*60000);
  const iso=(date:Date)=>date.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
  const title=event.title.replace(/\\/g,"\\\\").replace(/\r\n|\r|\n/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,");
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Nikolas Luque//JARVIS//ES","CALSCALE:GREGORIAN","BEGIN:VEVENT",`UID:${uid}@nikolas-luque`,`DTSTAMP:${iso(now)}`,`DTSTART:${iso(start)}`,`DTEND:${iso(end)}`,`SUMMARY:${title}`,"END:VEVENT","END:VCALENDAR",""].map(fold).join("\r\n");
}
