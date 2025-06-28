/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {  useEffect, useState, useRef } from 'react'
import './App.css'
import logo from './metro_logo.svg'
// import { httpsCallable } from "firebase/functions";
// import {firebaseFunctions} from './firebase'
import { ArrowFatLinesRight, Smiley, SmileyMeh, SmileySad } from '@phosphor-icons/react'
import { useWindowSize } from 'usehooks-ts'

import { StopValue, findStopId, getStops } from './stop_helpers'
import { addReviewToDatabase, getRandomStopForReview } from './db_layer'


// const getDataForStopId = httpsCallable(, 'retrieveStopId');

function App() {
  const stopLines = getStops();

  const [hasSeating, setHasSeating] = useState<boolean>(false);
  const [hasShelter, setHasShelter] = useState<boolean>(false);
  const [hasShade, setHasShade] = useState<boolean>(false);
  const [hasNoSign, setHasNoSign] = useState<boolean>(false);
  const [hasMissingBlockedSidewalk, setHasMissingBlockedSidewalk] = useState<boolean>(false);
  const [hasDirtyUnpleasantWaitingArea, setHasDirtyUnpleasantWaitingArea] = useState<boolean>(false);
  const [stopComment, setStopComment] = useState<string | undefined>(undefined);

  const commentRef = useRef(null);

  const handleKeyDown = (event : any) => {
    if (commentRef && event.target === commentRef.current) {
      // We are editing the text field and we shouldn't listen to key changes
      return;
    }
    if (event.key === '1') {
      setHasSeating(x => !x);
    }
    if (event.key === '2') {
      setHasShelter(x => !x);
    }
    if (event.key === '3') {
      setHasShade(x => !x);
    }
    if (event.key === '4') {
      setHasNoSign(x => !x);
    }
    if (event.key === '5') {
      setHasMissingBlockedSidewalk(x => !x);
    }
    if (event.key === '6') {
      setHasDirtyUnpleasantWaitingArea(x => !x);
    }

  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [stopValue, setStopValue] = useState<StopValue | undefined>(() => 
  {
    const possibleStopId = window.location.pathname.substring(1);
    if (possibleStopId.length > 0) {
      return findStopId(stopLines, possibleStopId);
    }
    else {
      return undefined;
    }
  });

  useEffect(() => {
    if (stopValue === undefined) {
      grabNewStopValue(); 
    }
  })

  const [stopData, setStopData] = useState<any | 'loading'>('loading');
  useEffect(() => {
    if (stopValue) {
      fetch('https://transit.land/api/v2/rest/stops/' + stopValue.id, {
        headers: {
          apikey: 'API_KEY'
        }
      }).then(
          data => {data.json().then(d => {
            console.log(d);
            if ('stops' in d){
              setStopData(d.stops[0]); 
            } else {
              setStopData({
                stop_name: stopValue.id,
                route_stops: [],
              });
              console.error(d);
            }
          })}
      ).catch(
        err => {console.error(err); alert(err.message)}
      )
    }
  }, [stopValue])

  const embedUrl = 'https://www.google.com/maps/embed' 
    + '?pb=' 
    + '!5v1684893451898!6m7!1m6!'  // last thing after m is number of arguments to take; thing after prev m is some sort of signature parm
    + '1s0' // was prev 1sAzyo1HXlYIJtqSwpM1silA, 
            // setting it to that puts us in Somerville, MA
            // where I created the original embed,
            // but if i remove it it goes to the x, y coords below
    + '!2m2!1d' 
    + stopValue?.x
    + '!2d' 
    + stopValue?.y
    + '!5f0.000!6f0'
    // + '!3f180!4f180.000!5f0.000' 
    // the last three are rotation in plane, camera rotation, and zoom

  const {width: windowWidth} = useWindowSize();
  
  async function grabNewStopValue() {
    const newStopValue = await getRandomStopForReview();
    window.location.pathname = '/' + newStopValue.id;
    setStopValue(newStopValue);
  }

  async function addNonSkipReviewToDatabaseAndContinue(rating: 'good' | 'bad' | 'meh') {
    if (stopValue) {
      await addReviewToDatabase(
        {
          isSkipped: false,
          stopId: stopValue.id,
          answers: [hasSeating, hasShelter, hasShade, hasNoSign, hasMissingBlockedSidewalk, hasDirtyUnpleasantWaitingArea],
          rating: rating,
          stopComment: stopComment,
        }
      )                    
      await grabNewStopValue();
    }
  }

  async function addSkipReviewToDatabaseAndContinue() {
    if (stopValue) {
      await addReviewToDatabase(
        {
          isSkipped: true,
          stopId: stopValue.id,
          stopComment: stopComment,
        }
      )

      await grabNewStopValue();
    }
  }

  return (
  <>
    <div style={{position: 'absolute', width: '100%', minHeight: '100%', top: 0, left: 0, backgroundColor: '#fff'}}>
      <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100vh'}}> 
        <div style={{marginBottom: '3%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', minWidth: '90%'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'start'}}>
            <div style={{display: 'flex', flexDirection: 'row'}}>
              {/* <p style={{marginRight: '10px', fontWeight: 600}}>Los Angeles</p> */}
              <h3 style={{fontWeight: 600, textDecoration: 'underline', marginBottom: 0, color: '#222'}}>Help rate a Metro stop</h3>
              <img src={logo} alt={'LA Metro'} style={{maxWidth: '70px', marginLeft: '10px'}}/>
            </div>
            <p style={{marginBottom: '0px', marginTop: '10px'}}><span style={{fontWeight: 'bold'}}>Current stop: </span>{stopData === 'loading' ? 'Loading...' : stopData.stop_name}</p>
            <p style={{marginBottom: '0px', marginTop: '5px'}}><span style={{fontWeight: 'bold'}}>Routes served: </span>{
              stopData === 'loading' ? 'Loading...' : stopData.route_stops.map((x : any) => { return x.route.route_short_name || x.route.route_long_name}).join(', ')
            }</p>
          </div>
          <p></p>
        </div>
        <div style={{minWidth: '90%', maxWidth: '95%', marginTop: '0', marginBottom: '2%', border: '2px solid #444', overflow: 'hidden', borderRadius: '5px', boxShadow: '2px 2px 10px #888', minHeight: 'min(70vh, 400px)', height: 'min(70vh, 400px)'}}>
          <iframe src={embedUrl} style={{border: 'none', width: '100%', height: '100%'}}></iframe>     
        </div>
        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between',  minWidth: '90%'}}>
          <div style={{marginBottom: '0.5em', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', minWidth: '90%', overflowWrap: 'break-word', wordWrap: 'break-word'}}> 
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '5px', overflowWrap: 'normal', marginRight: '5px'}}>
                <p style={{marginBottom: 0, textAlign: 'left'}}><span style={{fontWeight: 'bold'}}>This stop has:</span></p>

                {/* <p style={{marginBottom: '-5px', marginTop: '-2px', textDecoration: 'underline'}}>Positives</p> */}
                  <label style={{textAlign: 'left'}} className='checkbox'><input type='checkbox' checked={hasSeating} onChange={(event) => setHasSeating(event.target.checked)}/>Seating</label>
                  <label style={{textAlign: 'left'}}><input type='checkbox' checked={hasShelter} onChange={(event) => setHasShelter(event.target.checked)}/>Shelter</label>
                  <label style={{textAlign: 'left'}}><input type='checkbox' checked={hasShade} onChange={(event) => setHasShade(event.target.checked)}/>Shade</label>
                  {/* <p style={{marginBottom: '-5px', marginTop: '-2px', textDecoration: 'underline'}}>Negatives</p> */}
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '5px', overflowWrap: 'normal'}}>
                  <p style={{marginBottom: 0}}><span style={{fontWeight: 'bold'}}>What's wrong:</span></p>
                  <label style={{textAlign: 'left'}}><input type='checkbox' checked={hasNoSign} onChange={(event) => setHasNoSign(event.target.checked)}/>Sign not visible or missing</label>
                  <label style={{textAlign: 'left'}}><input type='checkbox' checked={hasMissingBlockedSidewalk} onChange={(event) => setHasMissingBlockedSidewalk(event.target.checked)}/>Missing/inaccesible{windowWidth <= 0 && <br/>} sidewalk</label>
                  <label style={{textAlign: 'left'}}><input type='checkbox' checked={hasDirtyUnpleasantWaitingArea} onChange={(event) => setHasDirtyUnpleasantWaitingArea(event.target.checked)}/>Dirty/unpleasant{windowWidth <= 0 && <br/>} waiting area</label>
                  </div>
          </div> 
          <div style={{display: 'flex', flexDirection: 'row', marginBottom: '1.5em'}}>
            <label style={{fontWeight: 'bold', display:'flex', flexDirection: 'column', alignItems: 'start'}}>(Optional) Leave a comment<input ref={commentRef} style={{width: '90vw', height: '1.5em'}} onChange={(event) => setStopComment(event.target.value)} type='text'/></label>
          </div>
          {/* <hr style={{height: '1px', backgroundColor: '#aaa', border: 'none', marginLeft: '5px', marginRight: '5px'}} /> */}
        </div>
        <div style={{flexGrow: '1'}}></div>
        <div style={{display: 'flex', bottom: '0', marginLeft: '5px', marginRight: '5px', minWidth: '90%', width: '100vw', backgroundColor: '#f5f5f5', boxShadow: '0px 0px 8px #bbb', backdropFilter: 'blur(2px)', justifyContent: 'center', alignItems: 'center', paddingBottom: '2%', paddingTop: '1.5%', borderTopLeftRadius: '4%', borderTopRightRadius: '4%'}}>
          <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', maxWidth: '95vw'}}>
            <div style={{backgroundColor: '#ddd', borderRadius: '30px', marginTop: '5px', marginBottom: '5px', paddingTop: '3px', paddingBottom: '3px', boxShadow: '2px 2px 4px #999'}}>
            <button onClick={async () => {
              await addNonSkipReviewToDatabaseAndContinue('good')
            }} style={{backgroundColor: '#5efc03', maxWidth: '33%', borderRadius: '100px', height: '70px', width: '30%', margin: '2px'}}>
              <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                <p style={{fontWeight: 'bold', margin: 0}}>Good</p>
                <Smiley size={'25px'} style={{marginTop: '8px', color: '#222'}}></Smiley>
              </div>
            </button>
            <button onClick={async () => {
              await addNonSkipReviewToDatabaseAndContinue('meh')
            }} style={{backgroundColor: '#fcad03', maxWidth: '33%', borderRadius: '100px', height: '70px', width: '30%', margin: '2px'}}>
              <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                <p style={{fontWeight: 'bold', margin: 0}}>Meh</p>
                <SmileyMeh size={'25px'} style={{marginTop: '8px', color: '#222'}}></SmileyMeh>
              </div>
            </button>
            <button onClick={async () => {
              await addNonSkipReviewToDatabaseAndContinue('bad')
            }} style={{backgroundColor: '#fc3903', maxWidth: '33%', borderRadius: '100px', height: '70px', width: '30%', margin: '2px'}}>
              <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                <p style={{fontWeight: 'bold', margin: 0}}>Bad</p>
                <SmileySad size={'25px'} style={{marginTop: '8px', color: '#222'}}></SmileySad>
              </div>
            </button>
            </div>
            <p style={{marginLeft: '2%', marginRight: '2%', textDecoration: 'underline'}}>Or</p>
            <button onClick={async () => {
              await addSkipReviewToDatabaseAndContinue()
            }} style={{maxWidth: '30%', padding: '15px', backgroundColor: '#95f5e8'}}>
                <div style={{flexDirection: 'row', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <p style={{fontWeight: 'bold', margin: 0, marginRight: '5px', color: '#222'}}>Skip</p>
                  <ArrowFatLinesRight style={{marginLeft: '5px', color: '#222'}} size={'20px'} />
                </div>
                <p style={{fontSize: '10px', margin: 0, color: '#222'}}>Can't find or discern this bus stop</p>
            </button>
          </div>
        </div>

      </div>
    </div>
  </>
  )
}

export default App
