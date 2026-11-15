import { supabase } from '../core.js';
import { requireAuth, SecurityError } from '../security-middleware.js';

const QUESTION_FIELDS = 'id,unit_id,question_text,option_a,option_b,option_c,option_d,difficulty,question_type,concept_name,subtopic,learning_objective';

export async function getQuestionBank(req, res, ctx) {
  requireAuth(ctx);
  const q = String(req.query?.q || '').trim().slice(0, 160);
  const topic = String(req.query?.topic || '').trim().slice(0, 100).replace(/[%_,]/g, ' ');
  const difficulty = String(req.query?.difficulty || '').toLowerCase();
  const questionType = String(req.query?.question_type || '').toLowerCase();
  const page = Math.max(1, Math.min(500, Number.parseInt(req.query?.page, 10) || 1));
  const limit = Math.max(1, Math.min(40, Number.parseInt(req.query?.limit, 10) || 20));
  if (difficulty && !['easy','medium','hard'].includes(difficulty)) throw new SecurityError('Invalid difficulty filter',400);
  const allowedTypes = ['single_choice','multiple_select','true_false','short_answer','numerical'];
  if (questionType && !allowedTypes.includes(questionType)) throw new SecurityError('Invalid question type filter',400);
  let query = supabase.from('quiz_questions').select(QUESTION_FIELDS,{count:'exact'})
    .eq('status','published').eq('is_active',true).eq('is_note_practice',false).order('id',{ascending:false});
  if (difficulty) query=query.eq('difficulty',difficulty);
  if (questionType) query=query.eq('question_type',questionType);
  if (topic) query=query.or(`concept_name.ilike.%${topic}%,subtopic.ilike.%${topic}%`);
  if (q) query=query.textSearch('search_vector',q,{type:'websearch',config:'english'});
  const from=(page-1)*limit;
  const {data,error,count}=await query.range(from,from+limit-1);
  if(error){console.error('[QUESTION_BANK_QUERY_FAILED]',JSON.stringify({user_id:ctx.userId,code:error.code}));throw new SecurityError('Unable to search the question bank',500);}
  return res.status(200).json({items:data||[],count:count||0,page,limit});
}
